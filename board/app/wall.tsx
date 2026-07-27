'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BoardMedia } from '@/lib/media'

type KindFilter = 'all' | 'photo' | 'video'

export default function Wall({ media }: { media: BoardMedia[] }) {
  const [kind, setKind] = useState<KindFilter>('all')
  const [author, setAuthor] = useState<string | null>(null)
  const [index, setIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const authors = useMemo(
    () => [...new Set(media.map((m) => m.author))].sort((a, b) => a.localeCompare(b)),
    [media],
  )

  const visible = useMemo(
    () =>
      media.filter((m) => {
        if (author && m.author !== author) return false
        if (kind === 'photo') return m.kind === 'photo'
        if (kind === 'video') return m.kind !== 'photo'
        return true
      }),
    [media, kind, author],
  )

  const open = index === null ? null : visible[index]
  const close = useCallback(() => setIndex(null), [])
  const step = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length)),
    [visible.length],
  )

  useEffect(() => {
    if (index === null) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [index, close, step])

  // Changing a filter would otherwise leave the lightbox on a stale index.
  useEffect(() => setIndex(null), [kind, author])

  async function copyUrls() {
    try {
      await navigator.clipboard.writeText(visible.map((m) => m.url).join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/8 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
          <h1 className="text-sm font-semibold tracking-tight text-neutral-100">Inspo Board</h1>

          <div className="flex gap-1">
            {(['all', 'photo', 'video'] as const).map((k) => (
              <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
                {k}
              </Chip>
            ))}
          </div>

          {authors.length > 1 && (
            <div className="flex flex-wrap gap-1">
              <Chip active={author === null} onClick={() => setAuthor(null)}>
                everyone
              </Chip>
              {authors.map((a) => (
                <Chip key={a} active={author === a} onClick={() => setAuthor(a)}>
                  @{a}
                </Chip>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[11px] text-neutral-600">{visible.length} shown</span>
            <button
              type="button"
              onClick={copyUrls}
              disabled={visible.length === 0}
              className="rounded-md border border-white/12 px-3 py-1.5 font-mono text-[11px] text-neutral-300 transition hover:border-white/30 hover:text-white disabled:opacity-40"
            >
              {copied ? 'copied ✓' : 'copy urls'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] px-5 py-5">
        {visible.length === 0 ? (
          <p className="py-32 text-center text-sm text-neutral-600">Nothing matches that filter.</p>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
            {visible.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                className="group relative mb-3 block w-full cursor-zoom-in overflow-hidden rounded-lg break-inside-avoid bg-white/5"
              >
                <img
                  src={item.kind === 'photo' ? item.url : (item.thumbUrl ?? item.url)}
                  alt={`Design reference from @${item.author}`}
                  loading="lazy"
                  className="block w-full transition duration-300 group-hover:scale-[1.02]"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 opacity-0 transition group-hover:opacity-100">
                  <span className="truncate font-mono text-[11px] text-white/90">
                    @{item.author}
                  </span>
                  {item.kind !== 'photo' && (
                    <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white">
                      {item.kind}
                    </span>
                  )}
                </span>
                {item.kind !== 'photo' && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black/93 backdrop-blur-sm"
        >
          <div
            className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-5 py-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-neutral-500">
              {(index ?? 0) + 1} / {visible.length}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={open.tweetUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-white/15 px-3 py-1.5 font-mono text-[11px] text-neutral-300 transition hover:border-white/35 hover:text-white"
              >
                @{open.author} — View on X ↗
              </a>
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-white/15 px-3 py-1.5 font-mono text-[11px] text-neutral-300 transition hover:border-white/35 hover:text-white"
              >
                Esc ✕
              </button>
            </div>
          </div>

          {/* Stage must not use items-center, or the wrapper collapses to the
              image's own height and max-h-full stops resolving. */}
          <div className="flex min-h-0 flex-1 justify-center gap-3 px-3 pb-6">
            {visible.length > 1 && <Arrow onClick={(e) => { e.stopPropagation(); step(-1) }}>‹</Arrow>}

            <div
              className="flex min-h-0 min-w-0 flex-1 items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {open.kind === 'photo' ? (
                <img
                  src={open.url}
                  alt={`Design reference from @${open.author}`}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              ) : (
                <video
                  key={open.url}
                  src={open.url}
                  poster={open.thumbUrl ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              )}
            </div>

            {visible.length > 1 && <Arrow onClick={(e) => { e.stopPropagation(); step(1) }}>›</Arrow>}
          </div>
        </div>
      )}
    </>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition ${
        active
          ? 'bg-neutral-100 text-neutral-950'
          : 'border border-white/10 text-neutral-400 hover:border-white/25 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function Arrow({
  onClick,
  children,
}: {
  onClick: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 self-center rounded-full border border-white/15 px-3 py-2 text-2xl leading-none text-neutral-400 transition hover:border-white/35 hover:text-white"
    >
      {children}
    </button>
  )
}
