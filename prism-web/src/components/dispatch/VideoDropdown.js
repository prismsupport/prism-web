'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import ModalBackdrop from '@/components/ui/ModalBackdrop'

// Plays a video stored in a private Supabase Storage bucket.
// Pass the stored path (not a URL); the signed link is created when opened.
//   consumer videos (reports, reopen_requests): bucket "report-photos"
//   lineman completion videos (job_assignments): bucket "assignment-proofs"
// If the mobile app stores videos in another bucket, change the bucket prop.
export default function VideoDropdown({ label = 'Video Evidence', bucket, path }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!path) {
    return (
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-1">{label}</p>
        <p className="text-xs text-gray-400 italic">No video submitted.</p>
      </div>
    )
  }

  async function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (url) return

    setLoading(true)
    setFailed(false)
    if (/^https?:\/\//.test(path)) {
      setUrl(path)
    } else {
      const supabase = createClient()
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
      if (error || !data) setFailed(true)
      else setUrl(data.signedUrl)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
        <Button type="button" variant="neutral" size="toggle" dim={false} onClick={toggle}>
          {open ? 'Hide Video' : 'View Video'}
        </Button>
      </div>
      {open && (
        <ModalBackdrop
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close video"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow hover:text-gray-700"
            >
              ✕
            </button>
            {loading && (
              <p className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                Loading video...
              </p>
            )}
            {failed && (
              <p className="flex min-h-48 items-center justify-center text-sm text-red-600">
                Unable to load video.
              </p>
            )}
            {url && !failed && (
              <video
                src={url}
                controls
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
                className="max-h-[calc(90vh-2rem)] w-full rounded-lg bg-black"
              />
            )}
          </div>
        </ModalBackdrop>
      )}
    </div>
  )
}