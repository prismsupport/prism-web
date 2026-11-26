import MetricCard from '@/components/dashboard/MetricCard'
import StatusBreakdown from '@/components/dashboard/StatusBreakdown'
import TrendChart from '@/components/dashboard/TrendChart'
import AdvisorySummary from '@/components/dashboard/AdvisorySummary'
import { formatMinutes } from '@/lib/performance'
import { STATUS_CARDS } from '@/lib/dashboard/constants'
import { trendSubtitle } from '@/lib/dashboard/helpers'

export default function OverviewTab({
  stats,
  unresolvedNow,
  statusCounts,
  trend,
  rangeKey,
  advisoryCounts,
  showAdvisories,
}) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total outage reports"
          value={stats.totalReports}
          hint={stats.declinedReports > 0 ? `${stats.declinedReports} declined` : undefined}
          compact
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" />
        </MetricCard>
        <MetricCard tone="green" label="Reports resolved" value={stats.resolvedReports} compact>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </MetricCard>
        <MetricCard
          tone="amber"
          label="Unresolved tickets"
          value={unresolvedNow}
          hint="Current: not yet resolved"
          compact
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" />
        </MetricCard>
        <MetricCard
          tone="green"
          label="Resolved within target"
          value={stats.resolutionPct !== null ? `${stats.resolutionPct}%` : '—'}
          hint={
            stats.targetMinutes
              ? `Target ${formatMinutes(stats.targetMinutes)} · ${stats.resolutionCount} resolved`
              : 'No resolution target set (Dispatch page)'
          }
          compact
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Dispatch Status Overview</h2>
          <p className="text-xs text-gray-400 mb-4">Current, all tickets</p>
          <StatusBreakdown cards={STATUS_CARDS} counts={statusCounts} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Report Trend</h2>
          <p className="text-xs text-gray-400 mb-4">{trendSubtitle(rangeKey)}</p>
          <TrendChart data={trend} />
        </div>
      </div>

      {showAdvisories && advisoryCounts && (
        <AdvisorySummary counts={advisoryCounts} className="mb-4" />
      )}
    </>
  )
}