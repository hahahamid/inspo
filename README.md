# inspo

A personal design-reference pipeline. Web design I like gets saved off X,
stored durably, and handed to a coding agent so it can build things in a style
I actually want.

```
   X / Twitter
        |
        v
  [ collector ]   back office. paste a link, media -> Cloudinary
        |
        |  GET /api/media
        v
  [ board ]       Pinterest-style wall of everything saved
        |
        v
  Claude / Codex  reads the board, learns the taste,
                  applies it to future design work
```

## Apps

| App | Port | Runs |
| --- | --- | --- |
| [`collector/`](./collector) | 3000 | locally — basic auth on everything except `/api/media` |
| [`board/`](./board) | 3001 | reads the collector's feed, no credentials, no write routes |

Start both:

```bash
cd collector && npm run dev    # :3000
cd board     && npm run dev    # :3001
```

The board reads `COLLECTOR_URL` (default `http://localhost:3000`). If the
collector is down the board says so rather than rendering an empty wall.

## Why the collector is never deployed

It has the only write endpoints in the system: ingest and (eventually) delete.
Exposing it publicly would mean building auth to protect a tool with exactly one
user. Keeping it on localhost removes the problem instead of solving it.

The board is pure read. It has no upload route and no delete route, so it is
safe to deploy with no auth at all — the worst a stranger can do is look.

## Getting started

```bash
cd collector
cp .env.example .env.local     # add your Cloudinary keys
npm install
npm run dev
```

See [`collector/README.md`](./collector/README.md) for the full setup.
