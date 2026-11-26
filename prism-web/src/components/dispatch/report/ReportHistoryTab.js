import StageTimesCard from '@/components/dispatch/StageTimesCard'
import JobOrderHistory from '@/components/dispatch/JobOrderHistory'

const COMPACT_SCROLL = 'lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto'

// "Time & History" tab of the report review page. Display only: the page owns the data.
export default function ReportHistoryTab({ reportId, assignmentStatus, pastAttempts, compactLayout }) {
  return (
    <div className={compactLayout ? 'grid grid-cols-1 xl:grid-cols-2 gap-4 items-start' : 'space-y-4'}>
      <div className={compactLayout ? COMPACT_SCROLL : ''}>
        <StageTimesCard reportId={reportId} key={assignmentStatus || 'none'} />
      </div>

      <JobOrderHistory attempts={pastAttempts} className={compactLayout ? COMPACT_SCROLL : ''} />

      {pastAttempts.length === 0 && (
        <p className="text-xs text-gray-400">No earlier attempts on this ticket.</p>
      )}
    </div>
  )
}