import StageTimesCard from '@/components/dispatch/StageTimesCard'
import JobOrderHistory from '@/components/dispatch/JobOrderHistory'

// "Time & History" tab of the Master Ticket page. Display only: the page owns the data.
export default function MasterHistoryTab({ masterId, assignmentStatus, pastAttempts }) {
  return (
    <>
      <StageTimesCard masterId={masterId} key={assignmentStatus || 'none'} />

      <JobOrderHistory attempts={pastAttempts} />

      {pastAttempts.length === 0 && (
        <p className="text-xs text-gray-400">No earlier attempts on this ticket.</p>
      )}
    </>
  )
}