'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '@/lib/types'

const TILE_COUNT = 14
const REPEL_RADIUS = 320
const REPEL_STRENGTH = 90
/** How fast a tile chases its target offset. Lower drifts more. */
const EASE = 0.12

type Tile = {
  item: MediaItem
  /** Base position as a viewport fraction. */
  left: number
  top: number
  width: number
  rotate: number
  depth: number
}

/**
 * Loose jittered grid rather than pure random, so tiles spread across the
 * viewport instead of clumping, and the middle stays clear for the text.
 */
function layout(items: MediaItem[]): Tile[] {
  const cols = 5
  const rows = 3
  const spots: { left: number; top: number }[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = (c + 0.5) / cols + (Math.random() - 0.5) * 0.11
      const top = (r + 0.5) / rows + (Math.random() - 0.5) * 0.16
      // Keep the centre band clear for the 404 copy.
      const centred = Math.abs(left - 0.5) < 0.22 && Math.abs(top - 0.5) < 0.2
      if (!centred) spots.push({ left, top })
    }
  }

  return spots
    .sort(() => Math.random() - 0.5)
    .slice(0, TILE_COUNT)
    .map((spot, i) => ({
      item: items[i % items.length],
      left: spot.left,
      top: spot.top,
      width: 150 + Math.random() * 130,
      rotate: (Math.random() - 0.5) * 24,
      depth: 0.5 + Math.random() * 0.8,
    }))
}

export default function NotFound() {
  const [tiles, setTiles] = useState<Tile[]>([])
  const nodes = useRef<(HTMLAnchorElement | null)[]>([])
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const offsets = useRef<{ x: number; y: number }[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/media')
      .then((res) => (res.ok ? res.json() : { media: [] }))
      .then((data: { media?: MediaItem[] }) => {
        if (cancelled) return
        const photos = (data.media ?? []).filter((m) => m.kind === 'photo' || m.thumbUrl)
        if (photos.length > 0) setTiles(layout(photos.sort(() => Math.random() - 0.5)))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (tiles.length === 0) return
    offsets.current = tiles.map(() => ({ x: 0, y: 0 }))

    function onMove(event: PointerEvent) {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    function onLeave() {
      pointer.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    let frame = 0
    const tick = () => {
      const p = pointer.current

      tiles.forEach((tile, i) => {
        const node = nodes.current[i]
        const current = offsets.current[i]
        if (!node || !current) return

        let targetX = 0
        let targetY = 0

        if (p) {
          const rect = node.getBoundingClientRect()
          const dx = rect.left + rect.width / 2 - current.x - p.x
          const dy = rect.top + rect.height / 2 - current.y - p.y
          const distance = Math.hypot(dx, dy)
          if (distance < REPEL_RADIUS && distance > 0.001) {
            const force = ((REPEL_RADIUS - distance) / REPEL_RADIUS) ** 2
            targetX = (dx / distance) * force * REPEL_STRENGTH * tile.depth
            targetY = (dy / distance) * force * REPEL_STRENGTH * tile.depth
          }
        }

        current.x += (targetX - current.x) * EASE
        current.y += (targetY - current.y) * EASE

        node.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) rotate(${tile.rotate}deg)`
      })

      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [tiles])

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Tiles sit behind the copy and never intercept its clicks. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {tiles.map((tile, i) => (
          <Link
            key={`${tile.item.id}-${i}`}
            href="/"
            ref={(node) => {
              nodes.current[i] = node
            }}
            tabIndex={-1}
            style={{
              left: `${tile.left * 100}%`,
              top: `${tile.top * 100}%`,
              width: tile.width,
              marginLeft: -tile.width / 2,
              opacity: 0.28 + tile.depth * 0.3,
              willChange: 'transform',
            }}
            className="pointer-events-auto absolute -translate-y-1/2 overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/60 transition-opacity duration-300 hover:!opacity-100"
          >
            <img
              src={tile.item.kind === 'photo' ? tile.item.url : (tile.item.thumbUrl ?? tile.item.url)}
              alt=""
              loading="lazy"
              draggable={false}
              className="block w-full select-none"
            />
          </Link>
        ))}
      </div>

      {/* Vignette so the copy stays legible whatever drifts underneath it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 42rem 26rem at 50% 50%, rgba(10,10,10,0.94) 0%, rgba(10,10,10,0.72) 45%, rgba(10,10,10,0) 75%)',
        }}
      />

      <div className="pointer-events-none relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-neutral-600">
          404
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-100 sm:text-5xl">
          Nothing saved here
        </h1>
        <p className="mt-3 max-w-sm text-sm text-neutral-500">
          {tiles.length > 0
            ? 'This page does not exist. These do — click any of them.'
            : 'This page does not exist.'}
        </p>
        <Link
          href="/"
          className="pointer-events-auto mt-8 rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-white"
        >
          Back to the board
        </Link>
      </div>
    </main>
  )
}
