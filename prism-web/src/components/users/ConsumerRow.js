import Button from '@/components/ui/Button'

export default function ConsumerRow({ consumer, onSelect }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-medium text-gray-900">
        {consumer.first_name} {consumer.last_name}
      </td>
      <td className="px-5 py-4 text-gray-600">{consumer.phone_number}</td>
      <td className="px-5 py-4 text-gray-600">{consumer.zone || '—'}</td>
      <td className="px-5 py-4 text-gray-600">{consumer.barangay || '—'}</td>
      <td className="px-5 py-4 text-gray-600">{consumer.municipality || '—'}</td>
      <td className="px-5 py-4 text-center align-middle">
        <Button type="button" size="row" dim={false} onClick={() => onSelect(consumer)}>
          Review
        </Button>
      </td>
    </tr>
  )
}
