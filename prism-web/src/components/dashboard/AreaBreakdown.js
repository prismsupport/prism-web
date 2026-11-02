'use client'

import { useState } from 'react'
import SegmentedControl from '@/components/ui/SegmentedControl'
import BarList from '@/components/dashboard/BarList'

const VIEWS = [
  { key: 'barangay', label: 'Barangay' },
  { key: 'municipality', label: 'Municipality' },
  { key: 'feeder', label: 'Feeder' },
  { key: 'substation', label: 'Substation' },
  { key: 'area_office', label: 'Area office' },
]

// breakdown = { barangay: [[name, count]], municipality: [...], feeder: [...], ... }
export default function AreaBreakdown({ breakdown }) {
  const [view, setView] = useState('barangay')

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-900">Outage Reports by Area</h2>
        <SegmentedControl options={VIEWS} value={view} onChange={setView} />
      </div>
      <p className="mb-4 text-xs text-gray-400">
        Feeder, substation, and area office come from the cooperative&apos;s Service Areas.
        Reports whose barangay is not listed there appear as Unmapped.
      </p>
      <BarList
        rows={breakdown?.[view] || []}
        emptyTitle="No reports in this period"
        emptyDescription="Reports show up here as consumers submit them."
      />
    </div>
  )
}