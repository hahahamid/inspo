# Inspo Collector

Back office for the inspo board. Paste a link to a design reference on X and
its images and videos get pushed to Cloudinary, indexed locally, and exposed as
a JSON feed.

## Where this fits

```
   X / Twitter
        |
        v
  [ collector ]   <- this app. paste link, media -> Cloudinary
        |
        |  GET /api/media
        v
  [ board ]       <- the Pinterest-style app (not built yet)
        |
        v
  Claude / Codex  <- reads the board, learns the design taste,
                     applies it to future work
```

This app has one job: get media out of X and into durable, publicly
addressable storage. It is not the product — it is the intake desk. Browsing,
curating, tagging, and anything agent-facing belongs in `board`.

## Setup

1. Free account at [cloudinary.com](https://cloudinary.com) (no credit card).
2. Copy the three values from **Console → Dashboard → API Keys** into `.env.local`:

   ```
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

3. `npm run dev`, then open <http://localhost:3000>.

## How it works

```
paste link
  -> parse the numeric post id out of the URL
  -> GET api.fxtwitter.com/i/status/<id>        (free, no auth)
  -> Cloudinary pulls each media URL server-side
  -> row per post + row per media file in data/collector.db
```

Media never passes through this process — Cloudinary fetches the
`pbs.twimg.com` URL directly. Videos get a generated `.jpg` poster frame.

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/ingest` | POST | `{ "url": "https://x.com/u/status/123" }` → saves the post |
| `/api/media` | GET | Flat JSON list of every saved file. CORS-open. |

`/api/media` is the contract the board consumes:

```json
{
  "count": 13,
  "media": [
    {
      "id": 1,
      "tweetId": "2080396943189049840",
      "tweetUrl": "https://x.com/CIJ37/status/2080396943189049840",
      "author": "CIJ37",
      "kind": "photo",
      "url": "https://res.cloudinary.com/<cloud>/image/upload/.../collector/....jpg",
      "thumbUrl": null,
      "width": 800,
      "height": 440,
      "savedAt": "2026-07-27T07:42:32.218Z"
    }
  ]
}
```

Those `res.cloudinary.com` URLs are public — the board can drop them straight
into an `<img src>`, and an agent can fetch them without credentials.

## Local UI

The grid here exists to confirm ingestion worked, not to browse seriously.
Click any card for a lightbox (Esc to close, ← → to move); each card has a
`View on X ↗` button for the original post.

## Notes

- **Database**: `data/collector.db`, plain SQLite via Node's built-in
  `node:sqlite`. No ORM, no native modules. Delete the file to reset.
- **Re-pasting a saved post** is a no-op; it returns the existing record
  instead of re-uploading.
- **Post source**: fxtwitter. If it ever goes down, `api.vxtwitter.com` is the
  usual backup, but its JSON shape differs — the normalizer in `lib/tweet.ts`
  would need a second branch.
- **Won't work on**: private accounts, deleted posts, posts with no media.
  Each returns a readable error in the UI.
- **Free tier**: Cloudinary gives 25 monthly credits (roughly 25GB). Check
  Console → Dashboard for actual consumption once you've saved real volume.
