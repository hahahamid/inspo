import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

export type MediaKind = 'photo' | 'video' | 'gif'

export type MediaRow = {
  id: number
  tweetId: string
  position: number
  kind: MediaKind
  sourceUrl: string
  url: string
  thumbUrl: string | null
  publicId: string
  width: number | null
  height: number | null
  bytes: number | null
}

export type TweetRow = {
  id: string
  url: string
  author: string
  authorName: string | null
  text: string | null
  postedAt: string | null
  savedAt: string
}

export type SavedTweet = TweetRow & { media: MediaRow[] }

export type MediaInput = Omit<MediaRow, 'id' | 'tweetId'>

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tweets (
  id          TEXT PRIMARY KEY,
  url         TEXT NOT NULL,
  author      TEXT NOT NULL,
  author_name TEXT,
  text        TEXT,
  posted_at   TEXT,
  saved_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tweet_id   TEXT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  kind       TEXT NOT NULL,
  source_url TEXT NOT NULL,
  url        TEXT NOT NULL,
  thumb_url  TEXT,
  public_id  TEXT NOT NULL,
  width      INTEGER,
  height     INTEGER,
  bytes      INTEGER,
  UNIQUE (tweet_id, position)
);

CREATE INDEX IF NOT EXISTS media_tweet_idx ON media (tweet_id);
`

// Cached on globalThis because Next dev reloads modules on every edit, which
// would otherwise leak a SQLite handle per reload.
const globalForDb = globalThis as unknown as { __collectorDb?: DatabaseSync }

function connect(): DatabaseSync {
  const dir = join(process.cwd(), 'data')
  mkdirSync(dir, { recursive: true })
  const conn = new DatabaseSync(join(dir, 'collector.db'))
  conn.exec('PRAGMA journal_mode = WAL')
  conn.exec('PRAGMA foreign_keys = ON')
  conn.exec('PRAGMA busy_timeout = 5000')
  conn.exec(SCHEMA)
  return conn
}

/**
 * Lazy on purpose. `next build` collects page data in several worker processes
 * that import this module without ever querying; connecting at module scope
 * made them race for the write lock and fail with SQLITE_BUSY.
 */
function db(): DatabaseSync {
  return (globalForDb.__collectorDb ??= connect())
}

type Row = Record<string, unknown>

function toTweet(r: Row): TweetRow {
  return {
    id: r.id as string,
    url: r.url as string,
    author: r.author as string,
    authorName: (r.author_name as string) ?? null,
    text: (r.text as string) ?? null,
    postedAt: (r.posted_at as string) ?? null,
    savedAt: r.saved_at as string,
  }
}

function toMedia(r: Row): MediaRow {
  return {
    id: Number(r.id),
    tweetId: r.tweet_id as string,
    position: Number(r.position),
    kind: r.kind as MediaKind,
    sourceUrl: r.source_url as string,
    url: r.url as string,
    thumbUrl: (r.thumb_url as string) ?? null,
    publicId: r.public_id as string,
    width: r.width == null ? null : Number(r.width),
    height: r.height == null ? null : Number(r.height),
    bytes: r.bytes == null ? null : Number(r.bytes),
  }
}

export function getTweet(id: string): SavedTweet | null {
  const row = db().prepare('SELECT * FROM tweets WHERE id = ?').get(id) as Row | undefined
  if (!row) return null
  const media = db()
    .prepare('SELECT * FROM media WHERE tweet_id = ? ORDER BY position')
    .all(id) as Row[]
  return { ...toTweet(row), media: media.map(toMedia) }
}

export function listTweets(): SavedTweet[] {
  const tweets = db()
    .prepare('SELECT * FROM tweets ORDER BY saved_at DESC')
    .all() as Row[]
  if (tweets.length === 0) return []

  const media = db()
    .prepare('SELECT * FROM media ORDER BY tweet_id, position')
    .all() as Row[]

  const byTweet = new Map<string, MediaRow[]>()
  for (const row of media) {
    const m = toMedia(row)
    const bucket = byTweet.get(m.tweetId)
    if (bucket) bucket.push(m)
    else byTweet.set(m.tweetId, [m])
  }

  return tweets.map((t) => ({ ...toTweet(t), media: byTweet.get(t.id as string) ?? [] }))
}

/** Flat media list — this is what the second app consumes. */
export function listMedia() {
  const rows = db()
    .prepare(
      `SELECT m.*, t.url AS tweet_url, t.author, t.saved_at
       FROM media m
       JOIN tweets t ON t.id = m.tweet_id
       ORDER BY t.saved_at DESC, m.position`,
    )
    .all() as Row[]

  return rows.map((r) => ({
    ...toMedia(r),
    tweetUrl: r.tweet_url as string,
    author: r.author as string,
    savedAt: r.saved_at as string,
  }))
}

export function saveTweet(tweet: TweetRow, media: MediaInput[]): SavedTweet {
  const insertTweet = db().prepare(
    `INSERT INTO tweets (id, url, author, author_name, text, posted_at, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       url = excluded.url, author = excluded.author, author_name = excluded.author_name,
       text = excluded.text, posted_at = excluded.posted_at`,
  )
  const insertMedia = db().prepare(
    `INSERT INTO media (tweet_id, position, kind, source_url, url, thumb_url, public_id, width, height, bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (tweet_id, position) DO UPDATE SET
       kind = excluded.kind, source_url = excluded.source_url, url = excluded.url,
       thumb_url = excluded.thumb_url, public_id = excluded.public_id,
       width = excluded.width, height = excluded.height, bytes = excluded.bytes`,
  )

  db().exec('BEGIN')
  try {
    insertTweet.run(
      tweet.id,
      tweet.url,
      tweet.author,
      tweet.authorName,
      tweet.text,
      tweet.postedAt,
      tweet.savedAt,
    )
    for (const m of media) {
      insertMedia.run(
        tweet.id,
        m.position,
        m.kind,
        m.sourceUrl,
        m.url,
        m.thumbUrl,
        m.publicId,
        m.width,
        m.height,
        m.bytes,
      )
    }
    db().exec('COMMIT')
  } catch (err) {
    db().exec('ROLLBACK')
    throw err
  }

  return getTweet(tweet.id)!
}
