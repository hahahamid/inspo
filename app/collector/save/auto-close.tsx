'use client'

import { useEffect, useState } from 'react'

const DELAY = 1400

/** Only works for windows opened by script, which is how the bookmarklet opens this. */
export default function AutoClose() {
  const [closing, setClosing] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      window.close()
      // Still here? This tab was opened by hand, so stop promising to close.
      setTimeout(() => setClosing(false), 300)
    }, DELAY)
    return () => clearTimeout(timer)
  }, [])

  return closing ? (
    <p className="mt-4 font-mono text-[11px] text-neutral-600">closing…</p>
  ) : (
    <a
      href="/collector"
      className="mt-6 rounded-lg border border-white/15 px-4 py-2 text-xs text-neutral-300 transition hover:border-white/35 hover:text-white"
    >
      Open the collector
    </a>
  )
}
