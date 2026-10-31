'use client'

import { useState } from 'react'
import AttemptReviewCard from '@/components/dispatch/AttemptReviewCard'

export default function JobOrderHistory({ attempts, className = '' }) {
  const [open, setOpen] = useState(false)
  if (!attempts || attempts.length === 0) return null

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex items-center justify-between w-full bg-white rounded-xl border border-gray-200 px-5 py-4 text-xs font-bold text-gray-900 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        <span>Job Order History ({attempts.length})</span>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm whitespace-nowrap group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
          {open ? 'Hide ▲' : 'View ▾'}
        </span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          {attempts.map((a) => (
            <AttemptReviewCard key={a.assignment_id} attempt={a} />
          ))}
        </div>
      )}
    </div>
  )
}
