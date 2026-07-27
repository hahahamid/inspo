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

| App | State | Runs |
| --- | --- | --- |
| [`collector/`](./collector) | working | locally only — never deployed |
| `board/` | not built yet | deployable, read-only |

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
