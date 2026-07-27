# inspo

A personal design-reference pipeline. Web design I like gets saved off X,
stored durably, and handed to a coding agent so it can build things in a style
I actually want.

One Next.js app, two surfaces:

| Route | What | Auth |
| --- | --- | --- |
| `/` | The board — masonry wall of everything saved | public |
| `/collector` | Back office — paste a link, it gets saved | **basic auth** |
| `/api/media` | JSON feed of every saved file | public |
| `/api/ingest` | Save a post | **basic auth** |

Anyone can look. Only you can add.

## Setup

```bash
cp .env.example .env.local     # Cloudinary keys + a username/password
npm install
npm run dev                    # http://localhost:3000
```

## How it works

```
paste a link at /collector
  -> parse the numeric post id out of the URL
  -> GET api.fxtwitter.com/i/status/<id>        (free, no auth)
  -> Cloudinary pulls each media URL server-side
  -> metadata appended to a JSON index, also on Cloudinary
  -> shows up on the board at /
```

## There is no database

Metadata lives in a single `collector/index.json` raw upload sitting next to
the media it describes. Reads go through the Cloudinary Admin API to get a
versioned URL, so they never hit a stale CDN copy. Writes are
read-modify-write on the whole blob.

That would be unsafe with concurrent writers. There is exactly one writer — a
person clicking Save — so it isn't. It also means the app has no filesystem
dependency, which is what lets it deploy anywhere.

## Deploying

Vercel, root directory left at the repo root. Set all five environment
variables in the project settings; `.env.local` never leaves your machine.

## Feeding an agent

The board's **copy urls** button puts every currently-visible Cloudinary URL
on the clipboard, one per line. Filter to one designer first if you want an
agent to learn a specific style rather than everything at once.

`/api/media` is the same data as JSON, CORS-open, no credentials needed.
