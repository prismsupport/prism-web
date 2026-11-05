'use client'

import Tabs from '@/components/ui/Tabs'

// Tab strip for the long ticket pages. Only the active section is shown, so the
// supervisor scrolls less. tabs: [{ key, label }]; label can include a badge.
export default function TicketTabs({ tabs, value, onChange, onClose }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <Tabs
        variant="underlineCompact"
        tabs={tabs}
        value={value}
        onChange={onChange}
        className="flex min-w-0 flex-1 flex-wrap gap-5"
      />
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close ticket details"
          className="shrink-0 text-xl leading-none text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  )
}

// Small attention dot for a tab label, e.g. QA waiting for review.
export function TabDot({ show }) {
  if (!show) return null
  return <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-red-500 align-middle" />
}