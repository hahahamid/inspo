import { listMedia } from '@/lib/db'

// Consumed by a separate app, so it is readable cross-origin.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'cache-control': 'no-store',
}

export async function GET() {
  const media = listMedia()
  return Response.json({ count: media.length, media }, { headers: CORS })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
