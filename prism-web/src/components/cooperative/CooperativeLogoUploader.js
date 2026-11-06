'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import useCooperativeProfile, { COOP_PROFILE_CHANGED } from '@/lib/supervisor/useCooperativeProfile'
import CooperativeLogo from '@/components/ui/CooperativeLogo'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { toast } from '@/lib/toast'

const BUCKET = 'coop-logos'
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_INPUT_MB = 5
const OUTPUT_SIZE = 512

// Centre-crops to a square and resizes, so every logo is small and uniform.
async function toSquareBlob(file) {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9))
  if (blob) return { blob, ext: 'webp', type: 'image/webp' }
  const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return { blob: png, ext: 'png', type: 'image/png' }
}

// "…/object/public/coop-logos/<coopId>/logo-123.webp" -> "<coopId>/logo-123.webp"
function pathFromUrl(url) {
  const marker = `/${BUCKET}/`
  const i = url ? url.indexOf(marker) : -1
  return i === -1 ? null : url.slice(i + marker.length).split('?')[0]
}

// Owner-only card. The page that shows it is responsible for hiding it from other supervisors.
export default function CooperativeLogoUploader() {
  const { id: coopId, name, logoUrl, loading } = useCooperativeProfile()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !coopId) return
    setError('')

    if (!ACCEPTED.includes(file.type)) {
      setError('Use a PNG, JPEG or WebP image.')
      return
    }
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      setError(`The image must be smaller than ${MAX_INPUT_MB} MB.`)
      return
    }

    setBusy(true)
    const supabase = createClient()
    let uploadedPath = null

    try {
      const { blob, ext, type } = await toSquareBlob(file)
      uploadedPath = `${coopId}/logo-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(uploadedPath, blob, { contentType: type, upsert: false })
      if (uploadError) throw uploadError

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath)

      const { error: saveError } = await supabase
        .from('cooperatives')
        .update({ logo_url: pub.publicUrl })
        .eq('id', coopId)
      if (saveError) throw saveError

      const oldPath = pathFromUrl(logoUrl)
      if (oldPath && oldPath !== uploadedPath) {
        await supabase.storage.from(BUCKET).remove([oldPath])
      }

      toast.success('Logo updated')
      window.dispatchEvent(new Event(COOP_PROFILE_CHANGED))
    } catch (err) {
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath])
      setError(err?.message || 'Could not upload the logo.')
      toast.error('Could not update the logo')
    }
    setBusy(false)
  }

  async function handleRemove() {
    if (!coopId || !logoUrl) return
    setBusy(true)
    setError('')
    const supabase = createClient()

    const { error: saveError } = await supabase
      .from('cooperatives')
      .update({ logo_url: null })
      .eq('id', coopId)

    if (saveError) {
      setError(saveError.message)
      toast.error('Could not remove the logo')
    } else {
      const oldPath = pathFromUrl(logoUrl)
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath])
      toast.success('Logo removed')
      window.dispatchEvent(new Event(COOP_PROFILE_CHANGED))
    }
    setBusy(false)
  }

  return (
    <Card>
      <h2 className="font-semibold text-gray-900 text-sm mb-1">Cooperative Logo</h2>
      <p className="text-xs text-gray-500 mb-4">
        Optional. Shown in the dashboard, to the Superadmin, and in the mobile app. Without a logo,
        your cooperative&apos;s initials are shown. Images are cropped to a square.
      </p>

      <div className="flex items-center gap-4">
        <CooperativeLogo name={name} src={logoUrl} size={72} />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="neutral"
            size="compact"
            dim={false}
            disabled={busy || loading}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'Working…' : logoUrl ? 'Change logo' : 'Upload logo'}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="dangerOutline"
              size="compact"
              dim={false}
              disabled={busy}
              onClick={handleRemove}
            >
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleSelected}
        />
      </div>

      <p className="text-xs text-gray-400 mt-3">PNG, JPEG or WebP, up to {MAX_INPUT_MB} MB.</p>
      <Alert className="mt-3">{error}</Alert>
    </Card>
  )
}