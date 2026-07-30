'use client'

import { useEffect, useRef, useState } from 'react'

function build(origin: string) {
  // Single line on purpose — bookmark URLs cannot contain newlines.
  return `javascript:(function(){var u=location.href;if(!/\\/status\\/\\d+/.test(u)){alert('Open an X post first, then click this.');return;}window.open('${origin}/collector/save?url='+encodeURIComponent(u),'inspo','width=460,height=320');})();`
}

export default function Bookmarklet() {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => setOrigin(window.location.origin), [])

  const code = origin ? build(origin) : ''

  // React strips `javascript:` hrefs, so set it on the node directly. This is
  // the whole point of a bookmarklet — it has to be draggable to the bar.
  useEffect(() => {
    if (linkRef.current && code) linkRef.current.setAttribute('href', code)
  }, [code])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-medium text-neutral-200">Save straight from X</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Drag this to your bookmarks bar. Then on any post, click it — a small window opens, saves,
        and closes itself.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          ref={linkRef}
          href="#"
          draggable
          onClick={(e) => e.preventDefault()}
          title="Drag me to the bookmarks bar"
          className="cursor-grab rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 transition select-none hover:bg-white active:cursor-grabbing"
        >
          ✦ Save to inspo
        </a>

        <button
          type="button"
          onClick={copy}
          disabled={!code}
          className="rounded-lg border border-white/12 px-3 py-2 font-mono text-[11px] text-neutral-400 transition hover:border-white/30 hover:text-white disabled:opacity-40"
        >
          {copied ? 'copied ✓' : 'copy code'}
        </button>

        <span className="font-mono text-[11px] text-neutral-700">
          {origin ? `→ ${origin}` : ''}
        </span>
      </div>

      <p className="mt-3 text-xs text-neutral-600">
        Dragging blocked? Use <span className="font-mono">copy code</span>, make a new bookmark by
        hand, and paste it as the URL.
      </p>
    </section>
  )
}
