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
          <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300" />
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
              className="text-xs font-semibold text-blue-700 whitespace-nowrap"
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