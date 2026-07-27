import { v2 as cloudinary } from 'cloudinary'
import type { MediaKind } from './db'
import { TweetError } from './tweet'

const FOLDER = 'collector'

let configured = false

function client() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new TweetError(
      'Cloudinary is not configured. Copy .env.example to .env.local and fill in your three keys from cloudinary.com/console.',
      500,
    )
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    })
    configured = true
  }
  return cloudinary
}

export type Uploaded = {
  url: string
  thumbUrl: string | null
  publicId: string
  width: number | null
  height: number | null
  bytes: number | null
}

/**
 * Cloudinary pulls the remote URL server-side, so the media never round-trips
 * through this process. Videos get a generated poster frame for the grid.
 */
export async function uploadFromUrl(
  sourceUrl: string,
  opts: { tweetId: string; position: number; kind: MediaKind },
): Promise<Uploaded> {
  const api = client()
  const isVideo = opts.kind !== 'photo'

  let res
  try {
    res = await api.uploader.upload(sourceUrl, {
      folder: FOLDER,
      public_id: `${opts.tweetId}_${opts.position}`,
      resource_type: isVideo ? 'video' : 'image',
      overwrite: true,
      invalidate: true,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new TweetError(`Cloudinary upload failed: ${detail}`, 502)
  }

  return {
    url: res.secure_url,
    thumbUrl: isVideo
      ? api.url(res.public_id, { resource_type: 'video', format: 'jpg', secure: true })
      : null,
    publicId: res.public_id,
    width: typeof res.width === 'number' ? res.width : null,
    height: typeof res.height === 'number' ? res.height : null,
    bytes: typeof res.bytes === 'number' ? res.bytes : null,
  }
}
