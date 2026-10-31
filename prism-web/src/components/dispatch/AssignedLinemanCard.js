import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { formatTime } from '@/lib/format'

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
            <span className="text-xs text-gray-400">Assigned: {formatTime(assignedAt)}</span>
          )}
          {expandable && (
            <Button type="button" variant="neutral" size="toggle" dim={false} onClick={onToggleExpand}>
              {expanded ? 'Hide Details ▲' : 'View Details ▾'}
            </Button>
          )}
        </div>
      </div>

      {expandable && expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">{children}</div>
      )}
    </div>
  )
}
