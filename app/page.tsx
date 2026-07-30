import type { Metadata } from 'next'
import { listMedia } from '@/lib/store'
import Wall from './wall'

export const metadata: Metadata = { title: 'Inspo Board' }

// Always reflects the current index.
export const dynamic = 'force-dynamic'

export default async function Home() {
  let media
  try {
    media = await listMedia()
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <h1 className="text-lg font-semibold text-neutral-100">Cannot read the index</h1>
        <p className="mt-2 text-sm text-neutral-500">{detail}</p>
      </main>
    )
  }

  if (media.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <h1 className="text-lg font-semibold text-neutral-100">Board is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Nothing saved yet. Add something from the collector.
        </p>
        <a
          href="/collector"
          className="mt-6 font-mono text-xs text-neutral-400 underline underline-offset-4 hover:text-white"
        >
          /collector →
        </a>
      </main>
    )
  }

  return <Wall media={media} showAuthors={false} showCopy={false} />
}
