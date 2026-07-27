# Inspo Board

The wall. Every design reference saved by the [collector](../collector),
laid out as a masonry grid.

```bash
npm run dev    # http://localhost:3001
```

Needs the collector running on :3000. Override with `COLLECTOR_URL` in
`.env.local` if it lives somewhere else.

## What it does

- Masonry grid of everything saved, newest first
- Filter by kind (photo / video) and by author
- Click anything for a lightbox — `Esc` closes, `←` `→` move through the
  current filter
- **copy urls** puts every currently-visible Cloudinary URL on the clipboard,
  one per line, ready to paste at an agent

## What it deliberately does not do

No upload route, no delete route, no credentials. It only ever reads
`GET /api/media`, which is the one collector endpoint left unauthenticated.
That is what makes this app safe to expose while the collector stays private.
