import Avatar from '@/components/ui/Avatar'

export default function AssignedLinemanCard({
  name,
  assignedAt,
  expandable = false,
  expanded = false,
  onToggleExpand,
  children,
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-blue-600 p-4">
      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Assigned Lineman</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
        <Avatar name={name || ''} size={40} />
          <p className="text-sm font-semibold text-gray-900">{name || 'Assigned'}</p>
        </div>
        <div className="flex items-center gap-3">
          {assignedAt && (
            <span className="text-xs text-gray-400">
              Assigned:{' '}
              {new Date(assignedAt).toLocaleTimeString('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
          {expandable && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="group inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap"
            >
              {expanded ? 'Hide Details ▲' : 'View Details ▾'}
            </button>
          )}
        </div>
      </div>

      {expandable && expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">{children}</div>
      )}
    </div>
  )
}