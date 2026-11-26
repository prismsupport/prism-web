import MetricCard from '@/components/dashboard/MetricCard'
import StageBreakdown from '@/components/dashboard/StageBreakdown'
import TopLinemanPerformance from '@/components/dashboard/TopLinemanPerformance'
import { formatMinutes } from '@/lib/performance'

export default function PerformanceTab({ stats, stageAverages, linemenPerformance }) {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          tone="amber"
          label="Avg. response time"
          value={formatMinutes(stats.avgResponse)}
          hint={
            stats.responsePct !== null
              ? `${stats.responsePct}% dispatched within ${stats.thresholdMinutes} min`
              : 'Submission to first dispatch'
          }
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </MetricCard>
        <MetricCard
          label="Avg. resolution time"
          value={formatMinutes(stats.avgResolution)}
          hint="Submission to final completion"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </MetricCard>
        <MetricCard
          label="Avg. repair time"
          value={formatMinutes(stats.avgRepair)}
          hint="First dispatch to completion"
        >
          <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
        </MetricCard>
      </div>

      <StageBreakdown averages={stageAverages} />

      <div className="mb-6">
        <TopLinemanPerformance linemen={linemenPerformance} />
      </div>
    </>
  )
}