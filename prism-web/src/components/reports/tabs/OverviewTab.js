import ReportSection from '@/components/reports/ReportSection'
import MiniStat from '@/components/reports/MiniStat'
import DeltaBadge from '@/components/reports/DeltaBadge'
import BarList from '@/components/dashboard/BarList'
import ReportTrendChart from '@/components/reports/ReportTrendChart'
import { REOPEN_LABELS, STATUS_BAR } from '@/lib/reports/constants'
import { priorityBar } from '@/lib/reports/helpers'

export default function OverviewTab({ data, summary, cmp, priorityLevels, statusLabel }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportSection title="Outage Frequency" description="Reports filed over the selected period.">
          <ReportTrendChart data={data.trend} unit={data.trendUnit} />
        </ReportSection>
        <ReportSection
          title="Issue Categories"
          description="Category chosen by the consumer. Older reports show as Uncategorized."
        >
          <BarList
            rows={data.issues}
            showShare
            emptyTitle="No reports in this period"
            emptyDescription="Try a wider date range or fewer location filters."
          />
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportSection
          title="Priority and Status"
          description="Priority set by supervisors and the current status of these reports."
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">By priority</p>
          <BarList
            rows={data.byPriority.map((p) => [p.label, p.count, priorityBar(p.label, priorityLevels)])}
            showRank={false}
            showShare
            emptyTitle="No reports in this period"
            emptyDescription="Try a wider date range or fewer filters."
          />
          <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-gray-400">By status</p>
          <BarList
            rows={data.byStatus
              .filter((p) => p.count > 0)
              .map((p) => [statusLabel(p.key), p.count, STATUS_BAR[p.key] || 'bg-gray-300'])}
            showRank={false}
            showShare
            emptyTitle="No reports in this period"
            emptyDescription="Try a wider date range or fewer filters."
          />
        </ReportSection>

        <div className="flex flex-col gap-4">
          <ReportSection
            title="Consolidation"
            description="Master Tickets group duplicate reports into one dispatch."
            className="!h-auto"
          >
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Reports merged" value={data.consolidation.mergedReports} />
              <MiniStat label="Master Tickets" value={data.consolidation.masterTickets} />
              <MiniStat
                label="Dispatches avoided"
                value={data.consolidation.dispatchesAvoided}
                tone="text-green-700"
              />
            </div>
          </ReportSection>

          <ReportSection
            title="Reopened Tickets"
            description="Reopens send a job back to a lineman."
            className="flex-1"
          >
            <div className="mb-5 flex items-end gap-3">
              <p className="font-display text-4xl font-extrabold tabular-nums text-gray-900">
                {summary.reopenedCount}
              </p>
              <p className="pb-1 text-xs">
                <DeltaBadge delta={cmp?.deltas.reopenedCount} good="down" />
              </p>
            </div>
            <BarList
              rows={Object.entries(summary.reopenSources || {}).map(([src, n]) => [
                REOPEN_LABELS[src] || src,
                n,
                'bg-amber-400',
              ])}
              showRank={false}
              emptyTitle="No reopened tickets"
              emptyDescription="Nothing was sent back to a lineman in this period."
            />
          </ReportSection>
        </div>
      </div>
    </>
  )
}