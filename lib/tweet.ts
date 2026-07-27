import type { MediaKind } from './types'

export type FetchedMedia = {
  kind: MediaKind
  sourceUrl: string
  thumbUrl: string | null
  width: number | null
  height: number | null
}

export type FetchedTweet = {
  id: string
  url: string
  author: string
  authorName: string | null
  text: string | null
  postedAt: string | null
  media: FetchedMedia[]
}

/** Thrown for anything the user should see a readable message about. */
export class TweetError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const STATUS_URL =
  /(?:twitter\.com|x\.com|fxtwitter\.com|vxtwitter\.com|fixupx\.com|nitter\.[^/]+)\/[^/]+\/status(?:es)?\/(\d+)/i

/**
 * Accepts a full tweet URL (any of the common mirrors, with or without
 * tracking params or a trailing /photo/1) or a bare numeric tweet id.
 */
export function parseTweetId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const matched = trimmed.match(STATUS_URL)
  if (matched) return matched[1]
  if (/^\d{5,25}$/.test(trimmed)) return trimmed
  return null
}

function toKind(raw: unknown): MediaKind {
  return raw === 'video' || raw === 'gif' ? raw : 'photo'
}

function toNumber(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

/**
 * fxtwitter mirrors the public tweet payload as JSON. The `i` placeholder
 * works in place of the real screen name, so we only need the numeric id.
 */
export async function fetchTweet(id: string): Promise<FetchedTweet> {
  let res: Response
  try {
    res = await fetch(`https://api.fxtwitter.com/i/status/${id}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
  } catch {
    throw new TweetError('Could not reach the tweet API. Check your connection and retry.', 503)
  }

  if (res.status === 404) throw new TweetError('That tweet does not exist or was deleted.', 404)
  if (res.status === 401) throw new TweetError('That tweet is from a private account.', 403)
  if (!res.ok) throw new TweetError(`Tweet API returned ${res.status}.`, 502)

  const body = (await res.json()) as {
    code?: number
    message?: string
    tweet?: Record<string, unknown>
  }

  const tweet = body.tweet
  if (!tweet) throw new TweetError(body.message ?? 'Tweet API returned no data.', 502)

  const author = (tweet.author ?? {}) as Record<string, unknown>
  const mediaBag = (tweet.media ?? {}) as Record<string, unknown>
  const rawMedia = Array.isArray(mediaBag.all) ? (mediaBag.all as Record<string, unknown>[]) : []

  const media: FetchedMedia[] = rawMedia
    .filter((m) => typeof m.url === 'string')
    .map((m) => ({
      kind: toKind(m.type),
      sourceUrl: m.url as string,
      thumbUrl: typeof m.thumbnail_url === 'string' ? m.thumbnail_url : null,
      width: toNumber(m.width),
      height: toNumber(m.height),
    }))

  if (media.length === 0) throw new TweetError('That tweet has no images or videos.', 422)

  return {
    id: String(tweet.id ?? id),
    url: typeof tweet.url === 'string' ? tweet.url : `https://x.com/i/status/${id}`,
    author: (author.screen_name as string) ?? 'unknown',
    authorName: (author.name as string) ?? null,
    text: typeof tweet.text === 'string' ? tweet.text : null,
    postedAt: typeof tweet.created_at === 'string' ? tweet.created_at : null,
    media,
  }
}
