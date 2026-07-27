import { client } from './cloudinary'
import type { MediaItem } from './types'

/**
 * All metadata lives in a single JSON blob stored as a Cloudinary raw upload,
 * next to the media it describes. No database, no second service.
 *
 * Read-modify-write on one blob would be unsafe with concurrent writers. This
 * has exactly one writer — a person clicking Save — so it is not.
 */
const INDEX_PUBLIC_ID = 'collector/index'

type Index = { version: 1; items: MediaItem[] }

const EMPTY: Index = { version: 1, items: [] }

async function readIndex(): Promise<Index> {
  const api = client()

  let resource: { secure_url: string }
  try {
    resource = (await api.api.resource(INDEX_PUBLIC_ID, {
      resource_type: 'raw',
    })) as { secure_url: string }
  } catch (err) {
    // First run: nothing saved yet.
    if ((err as { http_code?: number })?.http_code === 404) return EMPTY
    throw err
  }

  // The Admin API hands back a versioned URL, so this always reads the
  // newest blob rather than a stale CDN copy.
  const res = await fetch(resource.secure_url, { cache: 'no-store' })
  if (!res.ok) return EMPTY

  const parsed = (await res.json()) as Partial<Index>
  return Array.isArray(parsed?.items) ? { version: 1, items: parsed.items } : EMPTY
}

async function writeIndex(index: Index): Promise<void> {
  const api = client()
  const payload = Buffer.from(JSON.stringify(index))

  await new Promise<void>((resolve, reject) => {
    const stream = api.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: INDEX_PUBLIC_ID,
        overwrite: true,
        invalidate: true,
      },
      (error) => (error ? reject(error) : resolve()),
    )
    stream.end(payload)
  })
}

/** Newest first. */
export async function listMedia(): Promise<MediaItem[]> {
  const { items } = await readIndex()
  return items
}

export async function findTweet(tweetId: string): Promise<MediaItem[] | null> {
  const { items } = await readIndex()
  const found = items.filter((item) => item.tweetId === tweetId)
  return found.length > 0 ? found : null
}

/** Replaces any existing entry for the same post, then prepends. */
export async function saveTweet(items: MediaItem[]): Promise<MediaItem[]> {
  if (items.length === 0) return []
  const tweetId = items[0].tweetId
  const index = await readIndex()
  const others = index.items.filter((item) => item.tweetId !== tweetId)
  await writeIndex({ version: 1, items: [...items, ...others] })
  return items
}
