import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { PREVIEW_LOGO } from '@/lib/preview-logo'

// Share previews (WhatsApp, Facebook, X) work best as a 1200x630 JPEG under 300 KB.
export const PREVIEW_WIDTH = 1200
export const PREVIEW_HEIGHT = 630

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)

/** The listing photo as a JPEG data URL; the image renderer cannot read WebP. */
async function photoDataUrl(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
      .rotate()
      .resize(PREVIEW_WIDTH, PREVIEW_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    return null
  }
}

interface PreviewImageOptions {
  photoUrl?: string | null
  title: string
  highlight: string
  details?: string
  badge?: string
}

/** A branded preview: the car photo with the logo, title and price on top. */
export async function previewImageResponse({ photoUrl, title, highlight, details, badge }: PreviewImageOptions) {
  const photo = photoUrl ? await photoDataUrl(photoUrl) : null

  const png = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#111111' }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} style={{ position: 'absolute', top: 0, left: 0 }} />
        )}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 340, display: 'flex',
            backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.9))',
          }}
        />
        <div
          style={{
            position: 'absolute', top: 32, left: 40, display: 'flex', alignItems: 'center',
            background: 'rgba(0,0,0,0.65)', borderRadius: 18, padding: '10px 22px 10px 10px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PREVIEW_LOGO} alt="" width={60} height={60} style={{ borderRadius: 12 }} />
          <span style={{ color: '#ffffff', fontSize: 32, marginLeft: 14 }}>Kampala Cars</span>
        </div>
        {badge && (
          <div
            style={{
              position: 'absolute', top: 40, right: 40, display: 'flex', background: '#DC2626',
              color: '#ffffff', fontSize: 34, padding: '8px 24px', borderRadius: 12,
            }}
          >
            {badge}
          </div>
        )}
        <div style={{ position: 'absolute', left: 44, right: 44, bottom: 40, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', color: '#ffffff', fontSize: 62, lineHeight: 1.1 }}>{truncate(title, 34)}</div>
          <div style={{ display: 'flex', color: '#EAB308', fontSize: 56, marginTop: 12 }}>{highlight}</div>
          {details && <div style={{ display: 'flex', color: '#d6d3d1', fontSize: 28, marginTop: 10 }}>{truncate(details, 70)}</div>}
        </div>
      </div>
    ),
    { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }
  )

  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
