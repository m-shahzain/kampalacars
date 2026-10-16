import imageCompression from 'browser-image-compression'

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Phone photos can be large; they are shrunk before upload, so only reject
// files too big to process comfortably in the browser.
export const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024

// The upload API rejects bodies above 4 MB; compressed files are far below it.
const MAX_COMPRESSED_IMAGE_BYTES = 4 * 1024 * 1024

const COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 1600,
  maxSizeMB: 0.5,
  initialQuality: 0.85,
  useWebWorker: true,
}

let webpSupported: boolean | undefined

// Safari cannot encode WebP from a canvas and silently produces PNG instead,
// so those browsers get JPEG with the same size limits.
function canEncodeWebp() {
  if (webpSupported === undefined) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  }
  return webpSupported
}

/**
 * Resize and re-encode a photo for upload. Throws a user-facing error instead
 * of ever returning the original file.
 */
export async function compressImage(file: File): Promise<File> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`"${file.name}" is not a JPG, PNG, or WebP image.`)
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error(`"${file.name}" is larger than 25 MB. Please choose a smaller photo.`)
  }

  const fileType = canEncodeWebp() ? 'image/webp' : 'image/jpeg'
  let compressed: File
  try {
    compressed = await imageCompression(file, { ...COMPRESSION_OPTIONS, fileType })
  } catch {
    throw new Error(`Could not process "${file.name}". Please try a different photo.`)
  }

  if (compressed.type !== fileType || compressed.size > MAX_COMPRESSED_IMAGE_BYTES) {
    throw new Error(`Could not process "${file.name}". Please try a different photo.`)
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
  const extension = fileType === 'image/webp' ? 'webp' : 'jpg'
  return new File([compressed], `${baseName}.${extension}`, { type: fileType, lastModified: Date.now() })
}

/** Compress photos one at a time so phones are not overwhelmed. */
export async function compressImages(files: File[]): Promise<File[]> {
  const compressed: File[] = []
  for (const file of files) compressed.push(await compressImage(file))
  return compressed
}
