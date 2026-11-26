import EmptyState from '@/components/ui/EmptyState'
import { TableSkeletonRows } from '@/components/ui/Skeleton'

const COLUMN_COUNT = 8

// Table shell of the Dispatch page: header, loading rows, empty state, and footer.
// The rows (DispatchTicketRow) are passed as children.
export default function DispatchTicketTable({ loading, isEmpty, footer, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Ticket ID</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold text-center">Priority</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold text-center">Job Order Status</th>
              <th className="px-5 py-3 font-semibold">Assignee</th>
              <th className="px-5 py-3 font-semibold text-center">Last Updated</th>
              <th className="px-5 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && <TableSkeletonRows rows={6} cols={COLUMN_COUNT} />}
            {!loading && isEmpty && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState
                    title="No tickets match this view"
                    description="Try a different filter, or wait for new outage reports to come in."
                  />
                </td>
              </tr>
            )}
            {!loading && !isEmpty && children}
          </tbody>
        </table>
      </div>

      {footer}
    </div>
  )
}