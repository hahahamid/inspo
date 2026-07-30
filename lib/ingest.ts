import { findTweet, saveTweet } from './store'
import { uploadFromUrl } from './cloudinary'
import { fetchTweet, parseTweetId, TweetError } from './tweet'
import type { MediaItem } from './types'

export type IngestResult = { media: MediaItem[]; alreadySaved: boolean }

/**
 * Shared by POST /api/ingest and the /collector/save popup. The popup calls
 * this directly rather than fetching the API, because a browser does not
 * attach its cached basic-auth credentials to same-origin fetches — only to
 * document requests. Calling in-process sidesteps that entirely.
 */
export async function ingestPost(input: string): Promise<IngestResult> {
  const id = parseTweetId(input)
  if (!id) {
    throw new TweetError(
      'That is not a post link. Paste something like https://x.com/user/status/123',
      400,
    )
  }

  const existing = await findTweet(id)
  if (existing) return { media: existing, alreadySaved: true }

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

  return { media: await saveTweet(items), alreadySaved: false }
}
