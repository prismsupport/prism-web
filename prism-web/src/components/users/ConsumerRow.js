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
      <td className="px-5 py-4 text-center">
        <button
          type="button"
          onClick={() => onSelect(consumer)}
          className="inline-flex min-w-28 justify-center items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap"
        >
          Review
        </button>
      </td>
    </tr>
  )
}