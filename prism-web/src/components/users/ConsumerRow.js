import ViewAction from '@/components/ui/ViewAction'

export default function ConsumerRow({ consumer, onSelect }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 text-center font-medium text-gray-900">
        {consumer.first_name} {consumer.last_name}
      </td>
      <td className="px-5 py-4 text-center text-gray-600">{consumer.phone_number}</td>
      <td className="px-5 py-4 text-center text-gray-600">
        {consumer.accounts?.length ? (
          consumer.accounts.map((a) => <p key={a}>{a}</p>)
        ) : (
          '—'
        )}
      </td>
      <td className="px-5 py-4 text-center text-gray-600">{consumer.zone || '—'}</td>
      <td className="px-5 py-4 text-center text-gray-600">{consumer.barangay || '—'}</td>
      <td className="px-5 py-4 text-center text-gray-600">{consumer.municipality || '—'}</td>
      <td className="px-5 py-4 text-center align-middle">
        <ViewAction onClick={() => onSelect(consumer)} label="Review consumer details" />
      </td>
    </tr>
  )
}
