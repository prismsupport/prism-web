export default function SupervisorRow({ supervisor, currentUserId, onSelect }) {
  const isSelf = supervisor.id === currentUserId

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-medium text-gray-900">
        {supervisor.first_name} {supervisor.last_name}
        {isSelf && <span className="ml-2 text-xs text-gray-400">(You)</span>}
      </td>
      <td className="px-5 py-4">
        {supervisor.is_owner ? (
          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            OWNER
          </span>
        ) : supervisor.feature_access?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {supervisor.feature_access.map((f) => (
              <span
                key={f}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize"
              >
                {f}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400">No access granted</span>
        )}
      </td>
      <td className="px-5 py-4 text-gray-600">{supervisor.phone_number}</td>
      <td className="px-5 py-4">
        <button
          onClick={() => onSelect(supervisor)}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          Details
        </button>
      </td>
    </tr>
  )
}