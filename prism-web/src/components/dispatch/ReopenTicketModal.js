'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

// onConfirm(reason) must return an error message, or null when it worked.
export default function ReopenTicketModal({ ticketLabel, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (!reason.trim()) {
      setError('Please give a reason for reopening this ticket.')
      return
    }
    setSaving(true)
    setError('')
    const message = await onConfirm(reason.trim())
    if (message) {
      setError(message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Re-open Ticket" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Ticket <span className="font-semibold text-gray-700">{ticketLabel}</span> will go back
        to the same lineman as a new job order. The reason is saved with it and shown in the
        job order history.
      </p>

      <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
        REASON FOR REOPENING
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder="e.g. Power was lost again after the repair…"
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 mb-1"
      />
      <p className="text-xs text-gray-400 mb-4 text-right">{reason.length}/500</p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
        >
          {saving ? 'Reopening…' : 'Re-open Ticket'}
        </button>
      </div>
    </Modal>
  )
}