import { findTweet, saveTweet } from '@/lib/store'
import { uploadFromUrl } from '@/lib/cloudinary'
import { fetchTweet, parseTweetId, TweetError } from '@/lib/tweet'
import type { MediaItem } from '@/lib/types'

function fail(error: string, status: number) {
  return Response.json({ error }, { status })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { url?: unknown } | null
    const input = typeof body?.url === 'string' ? body.url : ''

    const id = parseTweetId(input)
    if (!id) {
      return fail('That is not a post link. Paste something like https://x.com/user/status/123', 400)
    }

    const existing = await findTweet(id)
    if (existing) return Response.json({ media: existing, alreadySaved: true })

    const tweet = await fetchTweet(id)
    const savedAt = new Date().toISOString()

    const items: MediaItem[] = await Promise.all(
      tweet.media.map(async (item, position) => {
        const uploaded = await uploadFromUrl(item.sourceUrl, {
          tweetId: tweet.id,
          position,
          kind: item.kind,
        })
        return {
          id: `${tweet.id}_${position}`,
          tweetId: tweet.id,
          tweetUrl: tweet.url,
          author: tweet.author,
          authorName: tweet.authorName,
          text: tweet.text,
          postedAt: tweet.postedAt,
          savedAt,
          position,
          kind: item.kind,
          sourceUrl: item.sourceUrl,
          ...uploaded,
          // Cloudinary only derives a poster for video; fall back to the post's own.
          thumbUrl: uploaded.thumbUrl ?? item.thumbUrl,
        }
      }),
    )

    const saved = await saveTweet(items)
    return Response.json({ media: saved, alreadySaved: false })
  } catch (err) {
    if (err instanceof TweetError) return fail(err.message, err.status)
    console.error('[ingest]', err)
    return fail('Something went wrong saving that post.', 500)
  }
}
