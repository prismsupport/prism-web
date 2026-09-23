export default function AssignedLinemanCard({ name, assignedAt }) {
  return (
    <div className="bg-white rounded-xl border-2 border-blue-600 p-4">
      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Assigned Lineman</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300" />
          <p className="text-sm font-semibold text-gray-900">{name || 'Assigned'}</p>
        </div>
        {assignedAt && (
          <span className="text-xs text-gray-400">
            Assigned:{' '}
            {new Date(assignedAt).toLocaleTimeString('en-PH', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  )
}