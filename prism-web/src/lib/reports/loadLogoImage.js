// Loads the cooperative logo as a PNG data URL for the PDF header.
// Returns { dataUrl, width, height } or null. It never throws, so a missing or
// unreachable logo just means the PDF is made without one.
//
// The logo is converted through a canvas because PDF libraries handle PNG and JPEG
// reliably but not always WebP (the web uploader saves WebP).

const MAX_SIDE = 256
const TIMEOUT_MS = 5000

export async function loadLogoImage(url) {
  if (!url) return null

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(url, { signal: controller.signal, cache: 'force-cache' })
    clearTimeout(timer)
    if (!res.ok) return null

    const bitmap = await createImageBitmap(await res.blob())
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // transparent logos get a white background in the PDF
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    return { dataUrl: canvas.toDataURL('image/png'), width, height }
  } catch {
    return null
  }
}