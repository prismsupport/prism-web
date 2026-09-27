'use client'

import { useState } from 'react'

export default function PhotoDropdown({ label = 'Attached Photo', photoUrl }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs font-bold text-gray-500 uppercase mb-1"
      >
        <span>{label}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open &&
        (photoUrl ? (
          <img
            src={photoUrl}
            alt={label}
            className="w-full rounded-lg border border-gray-200 mt-2"
          />
        ) : (
          <p className="text-xs text-gray-400 italic mt-1">No photo submitted.</p>
        ))}
    </div>
  )
}