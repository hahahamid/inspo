export type MediaKind = 'photo' | 'video' | 'gif'

export type MediaItem = {
  /** `${tweetId}_${position}` — stable, so re-saving a post overwrites cleanly. */
  id: string
  tweetId: string
  tweetUrl: string
  author: string
  authorName: string | null
  text: string | null
  postedAt: string | null
  savedAt: string
  position: number
  kind: MediaKind
  sourceUrl: string
  url: string
  thumbUrl: string | null
  publicId: string
  width: number | null
  height: number | null
  bytes: number | null
}
