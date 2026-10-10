import { summarizeSchedule } from '@/lib/lineman/schedule'

export default function LinemanRow({ lineman, onSelect }) {
  const shifts = summarizeSchedule(lineman.schedule)

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-medium text-gray-900">
        {lineman.first_name} {lineman.last_name}
      </td>
      <td className="px-5 py-4 text-gray-600">
        {lineman.assigned_area_office || '—'}
      </td>
      <td className="px-5 py-4">
        {shifts.length === 0 ? (
          <span className="text-xs text-gray-400">No schedule set</span>
        ) : (
          <div className="space-y-1.5">
            {shifts.map((s, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-gray-900">
                  {s.name} · {s.days}
                </p>
                <p className="text-xs text-gray-400">{s.time}</p>
              </div>
            ))}
          </div>
        )}
      </td>
      <td className="px-5 py-4 text-gray-600">{lineman.phone_number}</td>
      <td className="px-5 py-4">
        <button
          onClick={() => onSelect(lineman)}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          Details
        </button>
      </td>
    </tr>
  )
}