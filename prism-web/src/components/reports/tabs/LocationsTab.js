import ReportSection from '@/components/reports/ReportSection'
import AreaBreakdown from '@/components/dashboard/AreaBreakdown'
import BarList from '@/components/dashboard/BarList'
import { RECURRING_MIN_REPORTS } from '@/lib/recurring'

export default function LocationsTab({ data, summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AreaBreakdown breakdown={data.locations} />
      <ReportSection
        title="Recurring Incidents"
        description={`The same category reported ${RECURRING_MIN_REPORTS} or more times in the same barangay within the selected period. ${summary.reopenedCount} ticket${summary.reopenedCount === 1 ? ' was' : 's were'} reopened in this period.`}
      >
        <BarList
          rows={data.recurring.map((g) => [
            `${g.label} · ${g.barangay}${g.municipality ? ` (${g.municipality})` : ''}`,
            g.count,
          ])}
          emptyTitle="No recurring incidents"
          emptyDescription="Nothing was reported often enough in one barangay to count as recurring."
        />
      </ReportSection>
    </div>
  )
}