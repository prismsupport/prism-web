import AreaBreakdown from '@/components/dashboard/AreaBreakdown'
import BarList from '@/components/dashboard/BarList'
import ReopenedTicketsCard from '@/components/dashboard/ReopenedTicketsCard'
import { RECURRING_MIN_REPORTS, RECURRING_WINDOW_DAYS } from '@/lib/recurring'
import { sourceLabel } from '@/lib/dashboard/helpers'

export default function InsightsTab({ stats, areaBreakdown, issueData, recurringRows }) {
  const reopenHint = Object.entries(stats.reopenSources)
    .map(([src, n]) => `${n} ${sourceLabel(src)}`)
    .join(' · ')

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AreaBreakdown breakdown={areaBreakdown} />

        {/* Most common issues */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-gray-900">Most Common Issues</h2>
          <p className="mb-4 text-xs text-gray-400">
            Category chosen by the consumer. Older reports show as Uncategorized.
          </p>
          <BarList
            rows={issueData}
            emptyTitle="No reports in this period"
            emptyDescription="Issue categories appear as consumers submit reports."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-4">
        <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="mb-1 text-sm font-bold text-gray-900">Recurring Issues</h2>
          <p className="mb-4 text-xs text-gray-400">
            The same category reported {RECURRING_MIN_REPORTS} or more times in the same barangay in the
            last {RECURRING_WINDOW_DAYS} days. This window is fixed and does not follow the period selector.
          </p>
          <BarList
            rows={recurringRows}
            emptyTitle="No recurring issues"
            emptyDescription="Nothing has been reported often enough in one barangay to count as recurring."
          />
        </div>

        <ReopenedTicketsCard count={stats.reopenedCount} hint={reopenHint} />
      </div>
    </>
  )
}