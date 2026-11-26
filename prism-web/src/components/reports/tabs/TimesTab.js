import MetricCard from '@/components/dashboard/MetricCard'
import StageBreakdown from '@/components/dashboard/StageBreakdown'
import { formatMinutes } from '@/lib/performance'

export default function TimesTab({ summary, stageAverages }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard
          compact
          label="Avg. repair time"
          value={formatMinutes(summary.avgRepair)}
          hint="First dispatch to completion"
        >
          <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
        </MetricCard>
        <MetricCard
          compact
          tone="amber"
          label="Dispatched within limit"
          value={summary.responsePct !== null ? `${summary.responsePct}%` : '—'}
          hint={
            summary.thresholdMinutes
              ? `Response threshold ${summary.thresholdMinutes} min`
              : 'No response threshold set'
          }
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </MetricCard>
        <MetricCard
          compact
          tone="green"
          label="Resolved within target"
          value={summary.resolutionPct !== null ? `${summary.resolutionPct}%` : '—'}
          hint={
            summary.targetMinutes
              ? `Target ${formatMinutes(summary.targetMinutes)} · ${summary.resolutionCount} resolved`
              : 'No resolution target set (Dispatch settings)'
          }
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </MetricCard>
      </div>
      {/* StageBreakdown is already a card, so it is not wrapped in a Section */}
      <StageBreakdown averages={stageAverages} />
    </>
  )
}