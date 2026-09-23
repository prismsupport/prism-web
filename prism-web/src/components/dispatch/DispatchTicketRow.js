import Link from 'next/link'

const priorityStyles = {
  low: 'bg-blue-50 text-blue-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
  critical: 'bg-red-100 text-red-800',
}

const bucketColor = {
  pending: 'text-red-600',
  dispatched: 'text-amber-600',
  in_progress: 'text-amber-600',
  qa_review: 'text-blue-600',
  resolved: 'text-green-600',
  cancelled: 'text-gray-400',
}

function labelize(value) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function DispatchTicketRow({ ticket, assignment, bucket, isClustered, assigneeName }) {
  const isMaster = ticket.kind === 'master'
  const status = assignment ? assignment.status : ticket.status
  const isReviewable = !isMaster && !assignment && ticket.status === 'pending'
  const detailHref = isMaster
    ? `/supervisor/dispatch/master/${ticket.master_id}`
    : `/supervisor/dispatch/report/${ticket.report_id}`

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4">
        <p className="font-semibold text-gray-900">
          {isMaster ? ticket.master_ticket : ticket.ticket_number}
          {isMaster && (
            <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              MASTER · {ticket.report_count}
            </span>
          )}
        </p>
        {isClustered && (
          <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            Highly Likely Duplicate
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        {ticket.priority ? (
          <span
            className={`inline-block text-xs font-bold px-2 py-0.5 rounded uppercase ${priorityStyles[ticket.priority]}`}
          >
            {ticket.priority}
          </span>
        ) : (
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded uppercase bg-gray-100 text-gray-500">
            None
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        <p className="font-medium text-gray-900">
          {isMaster
            ? `${ticket.barangay}, ${ticket.municipality}`
            : ticket.nearest_landmark || `${ticket.barangay}, ${ticket.municipality}`}
        </p>
        <p className="text-xs text-gray-400">
          {!isMaster && `Zone ${ticket.zone || '—'}, `}
          {ticket.barangay}, {ticket.municipality} • {formatTime(ticket.created_at)}
        </p>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 font-medium ${bucketColor[bucket]}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {labelize(status)}
        </span>
      </td>
      <td className="px-5 py-4 text-gray-700">
        {assignment ? assigneeName || 'Assigned' : 'Unassigned'}
      </td>
      <td className="px-5 py-4 text-gray-600">
        {formatDateTime(
          assignment?.updated_at || assignment?.assigned_at || ticket.updated_at || ticket.created_at
        )}
      </td>
      <td className="px-5 py-4">
        {isReviewable ? (
          <Link
            href={detailHref}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors inline-block"
          >
            Review
          </Link>
        ) : (
          <Link
            href={detailHref}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors inline-block"
          >
            Details
          </Link>
        )}
      </td>
    </tr>
  )
}