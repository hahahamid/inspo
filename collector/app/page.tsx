import { listTweets } from '@/lib/db'
import AddTweet from './add-tweet'
import Gallery, { type GalleryItem } from './gallery'

// Reads SQLite on every request, so it must never be prerendered.
export const dynamic = 'force-dynamic'

export default function Home() {
  const tweets = listTweets()

  const items: GalleryItem[] = tweets.flatMap((tweet) =>
    tweet.media.map((media) => ({
      id: media.id,
      kind: media.kind,
      url: media.url,
      thumbUrl: media.thumbUrl,
      tweetUrl: tweet.url,
      author: tweet.author,
      text: tweet.text,
    })),
  )

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <header className="mb-8">
        <div className="mb-2 inline-block rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Back office
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Inspo Collector</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Paste a link to design inspiration on X. Its images and videos get pushed to Cloudinary
          and served to the board from{' '}
          <a href="/api/media" className="text-neutral-300 underline underline-offset-4 hover:text-white">
            /api/media
          </a>
          .
        </p>
      </header>

      <AddTweet />

      {items.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed border-white/10 py-20 text-center">
          <p className="text-sm text-neutral-500">Nothing saved yet.</p>
        </div>
      ) : (
        <>
          <p className="mt-10 mb-4 font-mono text-xs text-neutral-600">
            {items.length} item{items.length === 1 ? '' : 's'} · {tweets.length} tweet
            {tweets.length === 1 ? '' : 's'} · click any card to expand
          </p>
          <Gallery items={items} />
        </>
      )}
    </main>
  )
}
