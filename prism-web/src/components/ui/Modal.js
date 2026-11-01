'use client'

import { useEffect, useRef } from 'react'
import ModalBackdrop from '@/components/ui/ModalBackdrop'

const sizes = {
  md: 'max-w-lg',
  xl: 'max-w-3xl',
  xxl: 'max-w-5xl',
}

export default function Modal({ title, onClose, children, size = 'md' }) {
  const dialogRef = useRef(null)

  // Esc closes, focus moves into the dialog, and returns to the opener on close
  useEffect(() => {
    const opener = document.activeElement
    dialogRef.current?.focus()

    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [onClose])

  return (
    <ModalBackdrop>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || undefined}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-lg w-full ${sizes[size]} max-h-[90vh] overflow-y-auto focus:outline-none`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </ModalBackdrop>
  )
}