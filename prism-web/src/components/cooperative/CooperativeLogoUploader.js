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
    <Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-0">
      <div className="border-b border-gray-100 px-6 pb-5 pt-0">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Cooperative branding</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">Cooperative Logo</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Add the image members and staff will see across the dashboard, Superadmin tools, and mobile app.
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(240px,0.9fr)_minmax(320px,1.1fr)]">
        <div className="flex flex-col items-center justify-center border-b border-gray-100 bg-gray-50 px-6 py-10 text-center lg:border-b-0 lg:border-r">
          <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
            <CooperativeLogo name={name} src={logoUrl} size={176} />
          </div>
          <p className="mt-5 text-base font-semibold text-gray-900">{name || 'Your cooperative'}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
            <span className={`h-1.5 w-1.5 rounded-full ${logoUrl ? 'bg-green-500' : 'bg-gray-400'}`} />
            {logoUrl ? 'Custom logo active' : 'Using initials'}
          </span>
        </div>

        <div className="flex flex-col justify-between px-6 py-8">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Update your visual identity</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Choose a clear square image. It will be automatically cropped and optimized so it stays sharp in every part of the app.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recommended</p>
                <p className="mt-1 text-sm font-medium text-gray-700">Square image, 512 x 512</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Accepted</p>
                <p className="mt-1 text-sm font-medium text-gray-700">PNG, JPEG, or WebP</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap gap-3">
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
                  Remove logo
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-400">Maximum file size: {MAX_INPUT_MB} MB.</p>
            <Alert className="mt-3">{error}</Alert>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleSelected}
      />
    </Card>
  )
}