import type { Metadata } from 'next'
import { ingestPost } from '@/lib/ingest'
import { TweetError } from '@/lib/tweet'
import AutoClose from './auto-close'

export const metadata: Metadata = { title: 'Saving…' }

export const dynamic = 'force-dynamic'

/**
 * Popup target for the bookmarklet. Lives under /collector so the proxy's
 * basic auth already covers it, and the save runs here in-process — the
 * document request is authenticated, whereas a client-side fetch would not be.
 *
 * Yes, this writes on a GET. It is a personal tool behind auth, and repeating
 * the request is a no-op because saving an already-saved post dedupes.
 */
export default async function SavePage(props: {
  searchParams: Promise<{ url?: string }>
}) {
  const { url } = await props.searchParams
  const input = typeof url === 'string' ? url : ''

  let heading: string
  let detail: string | null = null
  let ok = false

  if (!input) {
    heading = 'No post URL was passed.'
  } else {
    try {
      const { media, alreadySaved } = await ingestPost(input)
      const author = media[0]?.author ?? 'unknown'
      ok = true
      heading = alreadySaved
        ? `Already saved — @${author}`
        : `Saved ${media.length} item${media.length === 1 ? '' : 's'} from @${author}`
    } catch (err) {
      heading = err instanceof TweetError ? err.message : 'Something went wrong.'
      detail = input
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-2xl leading-none">
        {ok ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✕</span>}
      </div>

      <p className={`text-sm ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{heading}</p>

      {detail && (
        <p className="mt-2 max-w-xs truncate font-mono text-[11px] text-neutral-700">{detail}</p>
      )}

      {ok ? (
        <AutoClose />
      ) : (
        <a
          href="/collector"
          className="mt-6 rounded-lg border border-white/15 px-4 py-2 text-xs text-neutral-300 transition hover:border-white/35 hover:text-white"
        >
          Open the collector
        </a>
      )}
    </main>
  )
}
