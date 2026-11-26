import StickyActionBar from '@/components/dispatch/StickyActionBar'
import ResolveTicketBar from '@/components/dispatch/ResolveTicketBar'

// Sticky Assign / Decline / Re-open actions of the report review page.
export default function ReportActionBar({ isPending, assignmentStatus, actionLoading, onAssign, onDecline, onReopen }) {
  return (
    <StickyActionBar id="ticket-action-bar">
      {isPending && (
        <div className="flex gap-3">
          <button onClick={onAssign} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors">
            Assign Lineman
          </button>
          <button onClick={onDecline} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors">
            Decline Report
          </button>
        </div>
      )}
      <ResolveTicketBar status={assignmentStatus} onReopen={onReopen} loading={actionLoading} />
    </StickyActionBar>
  )
}