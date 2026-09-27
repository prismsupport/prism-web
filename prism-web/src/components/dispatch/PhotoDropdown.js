'use client'

import { useState } from 'react'

export default function PhotoDropdown({ label = 'Attached Photo', photoUrl }) {
  const [open, setOpen] = useState(false)

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
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs font-bold text-gray-500 uppercase mb-1"
      >
        <span>{label}</span>
        <span className="text-blue-700 normal-case font-semibold">
          {open ? 'Hide Photo ▲' : 'View Photo ▾'}
        </span>
      </button>
      {open && (
        <img src={photoUrl} alt={label} className="w-full rounded-lg border border-gray-200 mt-2" />
      )}
    </div>
  )
}