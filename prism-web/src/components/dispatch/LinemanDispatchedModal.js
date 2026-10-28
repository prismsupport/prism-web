'use client'

import { useRouter } from 'next/navigation'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import Avatar from '@/components/ui/Avatar'

export default function LinemanDispatchedModal({ linemanName, ticketNumber, location, barangay, priority }) {
  const router = useRouter()
  const { priorityLabel } = useStatusLabels()

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl mx-auto mb-4">
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Lineman Dispatched</h2>
        <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
          TICKET: {ticketNumber}
        </span>

        <div className="bg-blue-50 rounded-lg p-4 text-left">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Dispatch Details</p>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar name={linemanName || ''} size={32} />
              <p className="text-sm font-semibold text-gray-900">{linemanName}</p>
            </div>
            {priority && (
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                {priorityLabel(priority).toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 uppercase mb-0.5">Primary Location</p>
          <p className="text-sm font-semibold text-gray-900">{location}</p>
          <p className="text-xs text-gray-500">{barangay}</p>
        </div>

        <button
          onClick={() => router.push('/supervisor/dispatch')}
          className="w-full mt-4 border border-blue-600 text-blue-700 font-semibold text-sm py-2.5 rounded-lg hover:bg-blue-50"
        >
          ↩ Return to Dispatch Board
        </button>
      </div>
    </div>
  )
}