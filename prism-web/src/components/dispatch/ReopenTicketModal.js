'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'

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

      <Alert>{error}</Alert>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" dim={false} onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={saving}>
          {saving ? 'Reopening…' : 'Re-open Ticket'}
        </Button>
      </div>
    </Modal>
  )
}
