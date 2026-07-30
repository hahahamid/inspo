import { ingestPost } from '@/lib/ingest'
import { TweetError } from '@/lib/tweet'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { url?: unknown } | null
    const input = typeof body?.url === 'string' ? body.url : ''
    return Response.json(await ingestPost(input))
  } catch (err) {
    if (err instanceof TweetError) return Response.json({ error: err.message }, { status: err.status })
    console.error('[ingest]', err)
    return Response.json({ error: 'Something went wrong saving that post.' }, { status: 500 })
  }
}
