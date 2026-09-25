export default function ConsumerRow({ consumer, onSelect }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-medium text-gray-900">
        {consumer.first_name} {consumer.last_name}
      </td>
      <td className="px-5 py-4 text-gray-600">{consumer.phone_number}</td>
      <td className="px-5 py-4 text-gray-600">{consumer.zone || '—'}</td>
      <td className="px-5 py-4 text-gray-600">{consumer.barangay || '—'}</td>
      <td className="px-5 py-4 text-gray-600">
        {consumer.municipality || '—'}
      </td>
      <td className="px-5 py-4">
        <button
          onClick={() => onSelect(consumer)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          Review
        </button>
      </td>
    </tr>
  )
}