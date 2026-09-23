function labelize(value) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const statusColor = {
  pending: 'text-red-600',
  dispatched: 'text-amber-600',
  in_progress: 'text-amber-600',
  qa_review: 'text-blue-600',
  resolved: 'text-green-600',
  cancelled: 'text-gray-400',
}

export default function TicketStatusPriority({ status, priority }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
          Current Status
        </p>
        <p className={`text-sm font-bold ${statusColor[status] || 'text-gray-600'}`}>
          ● {labelize(status)}
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
          Priority
        </p>
        <p className="text-sm font-bold text-red-600">
          {priority ? labelize(priority) : 'None'}
        </p>
      </div>
    </div>
  )
}