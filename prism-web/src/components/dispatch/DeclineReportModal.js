'use client'

import { useState } from 'react'

export default function DeclineReportModal({ reporterName, ticketNumber, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  function handleConfirm() {
    if (!reason.trim()) {
      setError('Please provide a reason before declining.')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Decline Outage Report</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
            <p className="text-xs font-bold text-red-600 uppercase mb-1">
              Declining Request For
            </p>
            <p className="text-sm text-gray-900 font-medium">Report From: {reporterName}</p>
            <p className="text-sm text-gray-900 font-medium">Report Ticket: {ticketNumber}</p>
          </div>

          <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
            REASON / REMARKS
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Provide specific details for the consumer regarding this decline…"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-600 font-semibold text-sm px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg"
          >
            {loading ? 'Submitting…' : 'Confirm Decline'}
          </button>
        </div>
      </div>
    </div>
  )
}