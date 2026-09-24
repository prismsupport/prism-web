import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

export default function CooperativeRow({ coop }) {
  const hasBeenUpdated = coop.updated_at !== coop.created_at
  const isPending = coop.status === 'Pending Approval'

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <td className="px-5 py-4">
        <span className="font-semibold text-gray-900 uppercase">
          {coop.cooperative_name}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="font-medium text-gray-800 uppercase text-xs">
          {coop.municipality}, {coop.province}
        </p>
        <p className="text-gray-400 text-xs mt-0.5">
          {coop.office_address}
        </p>
      </td>
      <td className="px-5 py-4 text-gray-600">
        {coop.official_email}
      </td>
      <td className="px-5 py-4 text-gray-600">
        {new Date(coop.created_at).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </td>
      <td className="px-5 py-4 text-gray-600">
        {hasBeenUpdated
          ? new Date(coop.updated_at).toLocaleDateString(
              'en-PH',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )
          : '—'}
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={coop.status} />
      </td>
      <td className="px-5 py-4">
        <Link
          href={`/superadmin/cooperatives/${coop.id}`}
          className={
            isPending
              ? 'inline-block bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors'
              : 'inline-block bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors'
          }
        >
          {isPending ? 'Review' : 'Details'}
        </Link>
      </td>
    </tr>
  )
}