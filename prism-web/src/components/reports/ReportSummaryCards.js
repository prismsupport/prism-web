import MetricCard from '@/components/dashboard/MetricCard'
import { withDelta } from '@/components/reports/DeltaBadge'
import { formatMinutes } from '@/lib/performance'

export default function ReportSummaryCards({ summary, cmp, refreshing }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 md:grid-cols-4 transition-opacity ${
        refreshing ? 'opacity-60' : ''
      }`}
    >
      <MetricCard
        compact
        label="Total outage reports"
        value={summary.totalReports}
        hint={
          withDelta(
            summary.declinedReports > 0 ? `${summary.declinedReports} declined` : '',
            cmp?.deltas.totalReports,
            null
          ) || undefined
        }
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect width="8" height="4" x="8" y="2" rx="1" />
      </MetricCard>
      <MetricCard compact tone="green" label="Reports resolved"
        value={summary.resolvedReports}
        hint={withDelta('', cmp?.deltas.resolvedReports, 'up') || undefined}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </MetricCard>
      <MetricCard
        compact
        tone="amber"
        label="Avg. response time"
        value={formatMinutes(summary.avgResponse)}
        hint={withDelta('Submission to first dispatch', cmp?.deltas.avgResponse, 'down')}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </MetricCard>
      <MetricCard
        compact
        label="Avg. resolution time"
        value={formatMinutes(summary.avgResolution)}
        hint={withDelta('Submission to final completion', cmp?.deltas.avgResolution, 'down')}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </MetricCard>
    </div>
  )
}