'use client'

import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'

export default function ResolveTicketBar({ status, onReopen, loading }) {
  const { statusLabel } = useStatusLabels()
  if (status !== 'resolved') return null

  return (
    <div className="flex gap-3">
      <button
        onClick={onReopen}
        disabled={loading}
        className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-700 font-semibold text-sm py-3 rounded-lg"
      >
        Re-open Ticket
      </button>
      <div className="flex-1 bg-green-600 text-white font-semibold text-sm py-3 rounded-lg text-center">
        ✓ {statusLabel('resolved')}
      </div>
    </div>
  )
}