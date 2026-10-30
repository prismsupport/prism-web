import PencilIcon from '@/components/ui/icons/PencilIcon'
import TrashIcon from '@/components/ui/icons/TrashIcon'
import StatusPill from '@/components/ui/StatusPill'

function formatTime(timeString) {
  const [h, m] = timeString.split(':')
  const hour = parseInt(h, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${m} ${period}`
}

export default function AdvisoryRow({ advisory, archived = false, onEdit, onDelete, onRestore }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {advisory.photoSignedUrl && (
            <img
              src={advisory.photoSignedUrl}
              alt=""
              className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
            />
          )}
          <span className="font-semibold text-gray-900">{advisory.title}</span>
        </div>
      </td>
      <td className="px-5 py-4 text-gray-600">
        {new Date(advisory.date).toLocaleDateString('en-PH', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>
      <td className="px-5 py-4 text-gray-600">{formatTime(advisory.start_time)}</td>
      <td className="px-5 py-4 text-gray-600">{formatTime(advisory.end_time)}</td>
      <td className="px-5 py-4">
        <StatusPill status={advisory.computedStatus} />
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1">
          {advisory.targets.map((t) => (
            <span
              key={t.target_id}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
            >
              {t.scope_type === 'entire_cooperative'
                ? 'Entire Cooperative'
                : t.target_value}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-4">
        {archived ? (
          <button
            onClick={() => onRestore(advisory)}
            className="inline-flex justify-center items-center rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap"
          >
            Restore
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit(advisory)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => onDelete(advisory)}
              className="text-red-500 hover:text-red-700"
              title="Archive"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}