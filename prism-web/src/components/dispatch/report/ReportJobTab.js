import QAReviewSection from '@/components/ui/QAReviewSection'
import AssignedLinemanCard from '@/components/dispatch/AssignedLinemanCard'
import JobOrderStatusLog from '@/components/dispatch/JobOrderStatusLog'

const COMPACT_SCROLL = 'lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto'

// "Job Order" tab of the report review page. Display only: the page owns the data.
export default function ReportJobTab({
  reportId,
  assignment,
  assignedLinemanName,
  statusLogs,
  issueCode,
  proofLocation,
  linemanDetailsOpen,
  onToggleLinemanDetails,
  onReviewed,
  compactLayout,
}) {
  const showQA = assignment?.status === 'fixed' || assignment?.status === 'resolved'

  return (
    <div className={compactLayout ? 'grid grid-cols-1 xl:grid-cols-2 gap-4 items-start' : 'space-y-4'}>
      {showQA && (
        <div className={compactLayout ? COMPACT_SCROLL : ''}>
          <QAReviewSection
            assignment={assignment}
            reportId={reportId}
            onReviewed={onReviewed}
            issueCode={issueCode}
            proofLocationConsistent={proofLocation}
            showReportInfo
            actionPortalId="ticket-action-bar"
          />
        </div>
      )}

      {assignment ? (
        <div className={compactLayout ? COMPACT_SCROLL : ''}>
          <AssignedLinemanCard
            name={assignedLinemanName}
            assignedAt={assignment.assigned_at}
            expandable
            expanded={linemanDetailsOpen}
            onToggleExpand={onToggleLinemanDetails}
          >
            <JobOrderStatusLog logs={statusLogs} />
          </AssignedLinemanCard>
        </div>
      ) : (
        <p className="text-sm text-gray-500 bg-white rounded-xl border border-gray-200 p-6">
          No lineman has been assigned yet.
        </p>
      )}
    </div>
  )
}