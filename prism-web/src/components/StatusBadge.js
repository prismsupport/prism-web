const statusColors = {
  'Pending Approval': 'text-red-600',
  Active: 'text-green-600',
  Rejected: 'text-amber-500',
  Deactivated: 'text-gray-900',
}

export default function StatusBadge({ status }) {
  const color = statusColors[status] || 'text-gray-600'

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}