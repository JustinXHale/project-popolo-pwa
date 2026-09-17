const MAX_SOURCE_BYTES = 12 * 1024 * 1024

export async function resizeImageFile(
  file: File,
  maxEdge: number,
  quality = 0.82,
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('That image is too large. Use a file under 12 MB.')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const type = 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), type, quality)
  })
  if (!blob) throw new Error('Could not compress the image.')
  return blob
}

export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}
