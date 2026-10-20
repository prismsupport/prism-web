export default function SupervisorRow({ supervisor, currentUserId, onSelect }) {
  const isSelf = supervisor.id === currentUserId

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-medium text-gray-900">
        {supervisor.first_name} {supervisor.last_name}
        {isSelf && <span className="ml-2 text-xs text-gray-400">(You)</span>}
      </td>
      <td className="px-5 py-4 text-center align-middle">
        {supervisor.is_owner ? (
          <div className="flex justify-center">
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              OWNER
            </span>
          </div>
        ) : supervisor.feature_access?.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1">
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
          type="button"
          onClick={() => onSelect(supervisor)}
          className="inline-flex min-w-28 justify-center items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap"
        >
          View Details
        </button>
      </td>
    </tr>
  )
}