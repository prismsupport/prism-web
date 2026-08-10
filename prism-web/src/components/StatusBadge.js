const statusStyles = {
  'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-green-50 text-green-700 border-green-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  Deactivated: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}
    >
      {status}
    </span>
  )
}