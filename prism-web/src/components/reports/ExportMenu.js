'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

export default function ExportMenu({ onExport, disabled, exporting }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function choose(kind) {
    setMenuOpen(false)
    onExport(kind)
  }

  return (
    <div className="relative">
      <Button
        variant="neutral"
        dim={false}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        disabled={disabled}
        className="whitespace-nowrap disabled:opacity-60"
      >
        {exporting ? 'Preparing…' : 'Export ▾'}
      </Button>
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close export menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => choose('xlsx')}
              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Excel (.xlsx)
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose('pdf')}
              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              PDF (.pdf)
            </button>
          </div>
        </>
      )}
    </div>
  )
}