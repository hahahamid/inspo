import type { Metadata } from 'next'
import { listMedia } from '@/lib/store'
import type { MediaItem } from '@/lib/types'
import AddTweet from './add-tweet'
import Bookmarklet from './bookmarklet'
import Wall from '../wall'

export const metadata: Metadata = { title: 'Inspo Collector' }

export const dynamic = 'force-dynamic'

export default async function Collector() {
  let media: MediaItem[]
  let error: string | null = null
  try {
    media = await listMedia()
  } catch (err) {
    media = []
    error = err instanceof Error ? err.message : String(err)
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <header className="mb-8">
        <div className="mb-2 inline-block rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Back office
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Inspo Collector</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Paste a link to design inspiration on X. Its images and videos go to Cloudinary and show
          up on{' '}
          <a href="/" className="text-neutral-300 underline underline-offset-4 hover:text-white">
            the board
          </a>
          .
        </p>
      </header>

      <AddTweet />

      <Bookmarklet />

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {media.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed border-white/10 py-20 text-center">
          <p className="text-sm text-neutral-500">Nothing saved yet.</p>
        </div>
      ) : (
        <div className="mt-12 -mx-6 overflow-hidden rounded-xl border border-white/8">
          <Wall media={media} title="Saved" sticky={false} />
        </div>
      )}
    </main>
  )
}
