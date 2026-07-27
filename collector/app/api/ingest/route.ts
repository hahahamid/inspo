import { getTweet, saveTweet, type MediaInput } from '@/lib/db'
import { fetchTweet, parseTweetId, TweetError } from '@/lib/tweet'
import { uploadFromUrl } from '@/lib/cloudinary'

function fail(error: string, status: number) {
  return Response.json({ error }, { status })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { url?: unknown } | null
    const input = typeof body?.url === 'string' ? body.url : ''

    const id = parseTweetId(input)
    if (!id) {
      return fail('That is not a tweet link. Paste something like https://x.com/user/status/123', 400)
    }

    const existing = getTweet(id)
    if (existing) return Response.json({ tweet: existing, alreadySaved: true })

    const tweet = await fetchTweet(id)

    const media: MediaInput[] = await Promise.all(
      tweet.media.map(async (item, position) => {
        const uploaded = await uploadFromUrl(item.sourceUrl, {
          tweetId: tweet.id,
          position,
          kind: item.kind,
        })
        return {
          position,
          kind: item.kind,
          sourceUrl: item.sourceUrl,
          ...uploaded,
          // Cloudinary only derives a poster for video; fall back to the tweet's own.
          thumbUrl: uploaded.thumbUrl ?? item.thumbUrl,
        }
      }),
    )

    const saved = saveTweet(
      {
        id: tweet.id,
        url: tweet.url,
        author: tweet.author,
        authorName: tweet.authorName,
        text: tweet.text,
        postedAt: tweet.postedAt,
        savedAt: new Date().toISOString(),
      },
      media,
    )

    return Response.json({ tweet: saved, alreadySaved: false })
  } catch (err) {
    if (err instanceof TweetError) return fail(err.message, err.status)
    console.error('[ingest]', err)
    return fail('Something went wrong saving that tweet.', 500)
  }
}
