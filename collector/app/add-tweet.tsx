'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

type Note = { kind: 'error' | 'ok'; text: string }

export default function AddTweet() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<Note | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy || !url.trim()) return

    setBusy(true)
    setNote(null)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()

      if (!res.ok) {
        setNote({ kind: 'error', text: data.error ?? 'Could not save that tweet.' })
        return
      }

      setUrl('')
      setNote({
        kind: 'ok',
        text: data.alreadySaved
          ? `Already saved — @${data.tweet.author}`
          : `Saved ${data.tweet.media.length} item${data.tweet.media.length === 1 ? '' : 's'} from @${data.tweet.author}`,
      })
      router.refresh()
    } catch {
      setNote({ kind: 'error', text: 'Network error. Is the dev server still running?' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://x.com/username/status/1234567890"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-white/25 focus:bg-white/8"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="shrink-0 rounded-lg bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>

      {note && (
        <p
          className={`mt-3 text-sm ${note.kind === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
          role="status"
        >
          {note.text}
        </p>
      )}
    </div>
  )
}
