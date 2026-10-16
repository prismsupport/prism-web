function labelize(value) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const PRIORITIES = ['low', 'medium', 'high', 'critical']

export default function DispatchFilters({
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
  statusOptions,
}) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 tracking-wide">PRIORITY</span>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="select-control text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {labelize(p)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 tracking-wide">
            JOB ORDER STATUS
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="select-control text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <a
        href="/supervisor/dispatch/create-master-ticket"
        className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors inline-block"
      >
        + Create Master Ticket
      </a>
    </div>
  )
}