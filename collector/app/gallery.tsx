'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MediaKind } from '@/lib/db'

export type GalleryItem = {
  id: number
  kind: MediaKind
  url: string
  thumbUrl: string | null
  tweetUrl: string
  author: string
  text: string | null
}

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState<number | null>(null)
  const open = index === null ? null : items[index]

  const close = useCallback(() => setIndex(null), [])
  const step = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : (i + delta + items.length) % items.length)),
    [items.length],
  )

  useEffect(() => {
    if (index === null) return

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key === 'ArrowLeft') step(-1)
    }

    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [index, close, step])

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.map((item, i) => (
          <figure
            key={item.id}
            className="group mb-4 break-inside-avoid overflow-hidden rounded-xl border border-white/10 bg-white/5"
          >
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Open ${item.kind} from @${item.author}`}
              className="relative block w-full cursor-zoom-in"
            >
              <img
                src={item.kind === 'photo' ? item.url : (item.thumbUrl ?? item.url)}
                alt={item.text ?? `Media from @${item.author}`}
                loading="lazy"
                className="block w-full transition group-hover:opacity-85"
              />
              {item.kind !== 'photo' && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                    <PlayIcon />
                  </span>
                </span>
              )}
            </button>

            <figcaption className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
              <span className="truncate font-mono text-neutral-500">@{item.author}</span>
              <a
                href={item.tweetUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-md border border-white/10 px-2 py-1 font-mono text-[11px] text-neutral-400 transition hover:border-white/25 hover:text-white"
              >
                View on X ↗
              </a>
            </figcaption>
          </figure>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Media from @${open.author}`}
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black/92 backdrop-blur-sm"
        >
          <div
            className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-5 py-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-neutral-500">
              {(index ?? 0) + 1} / {items.length}
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
                aria-label="Close"
                className="rounded-md border border-white/15 px-3 py-1.5 font-mono text-[11px] text-neutral-300 transition hover:border-white/35 hover:text-white"
              >
                Esc ✕
              </button>
            </div>
          </div>

          {/* No `items-center` here: the media wrapper must stretch to this row's
              height so the image's `max-h-full` has something definite to
              resolve against. Otherwise it renders at natural size and spills
              over the header. */}
          <div className="flex min-h-0 flex-1 justify-center gap-3 px-3 pb-6">
            {items.length > 1 && (
              <ArrowButton
                label="Previous"
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
              >
                ‹
              </ArrowButton>
            )}

            <div
              className="flex min-h-0 min-w-0 flex-1 items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {open.kind === 'photo' ? (
                <img
                  src={open.url}
                  alt={open.text ?? `Media from @${open.author}`}
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

            {items.length > 1 && (
              <ArrowButton
                label="Next"
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
              >
                ›
              </ArrowButton>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ArrowButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="shrink-0 self-center rounded-full border border-white/15 px-3 py-2 text-2xl leading-none text-neutral-400 transition hover:border-white/35 hover:text-white"
    >
      {children}
    </button>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
