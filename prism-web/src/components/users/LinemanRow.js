export default function LinemanRow({ lineman, onSelect }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-medium text-gray-900">
        {lineman.first_name} {lineman.last_name}
      </td>
      <td className="px-5 py-4 text-gray-600">
        {lineman.assigned_area_office || '—'}
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