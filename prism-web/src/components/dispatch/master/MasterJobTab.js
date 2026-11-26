import QAReviewSection from '@/components/ui/QAReviewSection'
import AssignedLinemanCard from '@/components/dispatch/AssignedLinemanCard'
import JobOrderStatusLog from '@/components/dispatch/JobOrderStatusLog'
import ReopenReasonNote from '@/components/dispatch/ReopenReasonNote'

// "Job Order" tab of the Master Ticket page. Display only: the page owns the data.
export default function MasterJobTab({
  masterId,
  assignment,
  assignedLinemanName,
  statusLogs,
  linemanDetailsOpen,
  onToggleLinemanDetails,
  onReviewed,
}) {
  const showQA = assignment?.status === 'fixed' || assignment?.status === 'resolved'

  return (
    <>
      {assignment?.reopen_reason && (
        <ReopenReasonNote source={assignment.reopen_source} reason={assignment.reopen_reason} />
      )}

      {showQA && (
        <QAReviewSection
          assignment={assignment}
          masterId={masterId}
          onReviewed={onReviewed}
          actionPortalId="ticket-action-bar"
        />
      )}

      {assignment && (
        <AssignedLinemanCard
          name={assignedLinemanName}
          assignedAt={assignment.assigned_at}
          expandable
          expanded={linemanDetailsOpen}
          onToggleExpand={onToggleLinemanDetails}
        >
          <JobOrderStatusLog logs={statusLogs} />
        </AssignedLinemanCard>
      )}
    </>
  )
}