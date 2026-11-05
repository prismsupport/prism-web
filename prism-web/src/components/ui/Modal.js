'use client'

import { useEffect, useRef, useState } from 'react'
import ModalBackdrop from '@/components/ui/ModalBackdrop'
import Button from '@/components/ui/Button'

const sizes = {
  md: 'max-w-lg',
  xl: 'max-w-3xl',
  xxl: 'max-w-5xl',
}

// warnOnClose={false} turns the unsaved-changes warning off for a modal
// that stays open after saving.
export default function Modal({
  title,
  onClose,
  children,
  size = 'md',
  warnOnClose = true,
  stickyHeader = false,
}) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const warnRef = useRef(warnOnClose)
  const dirtyRef = useRef(false)
  const askingRef = useRef(false)
  const [asking, setAsking] = useState(false)

  onCloseRef.current = onClose
  warnRef.current = warnOnClose

  function setAskingBoth(value) {
    askingRef.current = value
    setAsking(value)
  }

  function requestClose() {
    if (warnRef.current && dirtyRef.current) {
      setAskingBoth(true)
      return
    }
    onCloseRef.current?.()
  }

  // Esc closes (or dismisses the warning), focus moves into the dialog,
  // and returns to the opener on close
  useEffect(() => {
    const opener = document.activeElement
    dialogRef.current?.focus()

    function onKey(e) {
      if (e.key !== 'Escape') return
      if (askingRef.current) {
        setAskingBoth(false)
        return
      }
      requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [])

  return (
    <ModalBackdrop>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || undefined}
        tabIndex={-1}
        onChange={(e) => {
          if (e.target?.closest?.('form')) dirtyRef.current = true
        }}
        className={`bg-white rounded-2xl shadow-lg w-full ${sizes[size]} max-h-[90vh] overflow-y-auto focus:outline-none`}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${
            stickyHeader ? 'sticky top-0 z-20 bg-white' : ''
          }`}
        >
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {asking && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3"
          >
            <p className="text-sm font-medium text-amber-900">Discard your unsaved changes?</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                dim={false}
                onClick={() => setAskingBoth(false)}
              >
                Keep editing
              </Button>
              <Button type="button" variant="danger" size="sm" dim={false} onClick={() => onCloseRef.current?.()}>
                Discard
              </Button>
            </div>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </ModalBackdrop>
  )
}