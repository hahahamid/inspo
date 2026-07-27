import { createHash, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

const REALM = 'Inspo Collector'

/**
 * Hash both sides to a fixed 32 bytes before comparing. `timingSafeEqual`
 * throws on length mismatch, and comparing raw strings would leak the
 * credential length through timing.
 */
function matches(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

function challenge(message: string) {
  return new Response(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}

export function proxy(request: NextRequest) {
  const user = process.env.COLLECTOR_USER
  const password = process.env.COLLECTOR_PASSWORD

  if (!user || !password) {
    return new Response('COLLECTOR_USER and COLLECTOR_PASSWORD are not set.', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const header = request.headers.get('authorization')
  if (!header?.startsWith('Basic ')) return challenge('Authentication required.')

  let decoded: string
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  } catch {
    return challenge('Malformed credentials.')
  }

  const separator = decoded.indexOf(':')
  if (separator === -1) return challenge('Malformed credentials.')

  const okUser = matches(decoded.slice(0, separator), user)
  const okPassword = matches(decoded.slice(separator + 1), password)

  // Both compared unconditionally so a wrong username and a wrong password
  // take the same time.
  if (!okUser || !okPassword) return challenge('Invalid credentials.')
}

/**
 * Only the write surface is guarded. The board at `/` and the `/api/media`
 * feed stay public — they are read-only, and agents need the feed without
 * credentials.
 */
export const config = {
  matcher: ['/collector', '/collector/:path*', '/api/ingest', '/api/ingest/:path*'],
}
