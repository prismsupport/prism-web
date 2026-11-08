import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import CooperativeLogo from '@/components/ui/CooperativeLogo'
import { formatDate, DATE_SHORT, timeAgo } from '@/lib/format'

export default function CooperativeRow({ coop }) {
  const hasBeenUpdated = coop.updated_at !== coop.created_at
  const isPending = coop.status === 'Pending Approval'

  return (
    <tr
      className={`border-b border-gray-100 transition-colors last:border-0 hover:bg-blue-50/40 ${
        isPending ? 'bg-red-50/30' : ''
      }`}
    >
      <td className="relative px-5 py-4">
        {isPending && (
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-red-500" />
        )}
        <div className="flex items-center gap-3">
          <CooperativeLogo name={coop.cooperative_name} src={coop.logo_url} size={40} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{coop.cooperative_name}</p>
            {isPending && <p className="text-xs font-medium text-red-600">Needs your review</p>}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium text-gray-800">
          {[coop.municipality, coop.province].filter(Boolean).join(', ') || '—'}
        </p>
        <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-400" title={coop.office_address}>
          {coop.office_address || 'No address provided'}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="max-w-[220px] truncate text-gray-700" title={coop.official_email}>
          {coop.official_email || '—'}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{coop.contact_number || '—'}</p>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <p className="text-gray-700">{formatDate(coop.created_at, DATE_SHORT)}</p>
        <p className="mt-0.5 text-xs text-gray-400">{timeAgo(coop.created_at)}</p>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        {hasBeenUpdated ? (
          <>
            <p className="text-gray-700">{formatDate(coop.updated_at, DATE_SHORT)}</p>
            <p className="mt-0.5 text-xs text-gray-400">{timeAgo(coop.updated_at)}</p>
          </>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>

      <td className="px-5 py-4 text-center">
        <StatusBadge status={coop.status} />
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/superadmin/cooperatives/${coop.id}`}
          className={`group inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            isPending
              ? 'bg-blue-700 text-white shadow-sm hover:bg-blue-800'
              : 'border border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          {isPending ? 'Review' : 'Details'}
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </td>
    </tr>
  )
}