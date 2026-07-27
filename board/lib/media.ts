export type MediaKind = 'photo' | 'video' | 'gif'

export type BoardMedia = {
  id: number
  tweetId: string
  tweetUrl: string
  author: string
  kind: MediaKind
  url: string
  thumbUrl: string | null
  width: number | null
  height: number | null
  savedAt: string
}

export type Feed = { ok: true; media: BoardMedia[] } | { ok: false; error: string }

export function collectorUrl(): string {
  return process.env.COLLECTOR_URL ?? 'http://localhost:3000'
}

/**
 * The board is read-only: it never writes, so it needs no credentials.
 * /api/media is the only collector route left unauthenticated.
 */
export async function fetchMedia(): Promise<Feed> {
  const base = collectorUrl()
  try {
    const res = await fetch(`${base}/api/media`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    if (res.status === 401) {
      return { ok: false, error: `The collector is requiring auth on /api/media. It should be open.` }
    }
    if (!res.ok) return { ok: false, error: `Collector returned ${res.status}.` }
    const data = (await res.json()) as { media?: BoardMedia[] }
    return { ok: true, media: data.media ?? [] }
  } catch {
    return { ok: false, error: `Could not reach the collector at ${base}.` }
  }
}
