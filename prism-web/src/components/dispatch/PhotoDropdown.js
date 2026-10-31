'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import ModalBackdrop from '@/components/ui/ModalBackdrop'

export default function PhotoDropdown({ label = 'Attached Photo', photoUrl }) {
  const [open, setOpen] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  function togglePhoto() {
    if (open) {
      setOpen(false)
      return
    }

    setImageLoading(true)
    setImageError(false)
    setOpen(true)
  }

  if (!photoUrl) {
    return (
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-1">{label}</p>
        <p className="text-xs text-gray-400 italic">No photo submitted.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
        <Button type="button" variant="neutral" size="toggle" dim={false} onClick={togglePhoto}>
          {open ? 'Hide Photo' : 'View Photo'}
        </Button>
      </div>
      {open && (
        <ModalBackdrop
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          aria-busy={imageLoading}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl items-center justify-center overflow-hidden rounded-xl bg-white p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close photo"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow hover:text-gray-700"
            >
              ✕
            </button>
            {imageLoading && (
              <p className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                Loading photo...
              </p>
            )}
            {imageError ? (
              <p className="min-h-48 content-center text-sm text-red-600">
                Unable to load photo.
              </p>
            ) : (
              <img
                src={photoUrl}
                alt={label}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false)
                  setImageError(true)
                }}
                className={`max-h-[calc(90vh-2rem)] w-full rounded-lg object-contain ${
                  imageLoading ? 'hidden' : ''
                }`}
              />
            )}
          </div>
        </ModalBackdrop>
      )}
    </div>
  )
}
