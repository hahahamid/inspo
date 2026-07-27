import { listMedia } from '@/lib/store'

// Read by the board and by agents, so it is open and cross-origin readable.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'cache-control': 'no-store',
}

export async function GET() {
  try {
    const media = await listMedia()
    return Response.json({ count: media.length, media }, { headers: CORS })
  } catch (err) {
    console.error('[media]', err)
    return Response.json({ error: 'Could not read the index.' }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
