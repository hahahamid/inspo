import { collectorUrl, fetchMedia } from '@/lib/media'
import Wall from './wall'

// Always reflects whatever the collector currently holds.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const feed = await fetchMedia()

  if (!feed.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <h1 className="text-lg font-semibold text-neutral-100">Collector unreachable</h1>
        <p className="mt-2 text-sm text-neutral-500">{feed.error}</p>
        <p className="mt-6 font-mono text-xs text-neutral-600">
          cd collector && npm run dev
        </p>
        <p className="mt-2 font-mono text-[11px] text-neutral-700">
          expecting it at {collectorUrl()}
        </p>
      </main>
    )
  }

  if (feed.media.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <h1 className="text-lg font-semibold text-neutral-100">Board is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Save something in the collector and it shows up here.
        </p>
        <a
          href={collectorUrl()}
          target="_blank"
          rel="noreferrer"
          className="mt-6 font-mono text-xs text-neutral-400 underline underline-offset-4 hover:text-white"
        >
          open the collector ↗
        </a>
      </main>
    )
  }

  return <Wall media={feed.media} />
}
