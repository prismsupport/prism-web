import RowActions from '@/components/ui/RowActions'
import StatusPill from '@/components/ui/StatusPill'
import Badge from '@/components/ui/Badge'
import { formatClockTime, formatDate } from '@/lib/format'

export default function AdvisoryRow({ advisory, onEdit, onDelete }) {
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
      <td className="px-5 py-4 text-gray-600">{formatDate(advisory.date)}</td>
      <td className="px-5 py-4 text-gray-600">{formatClockTime(advisory.start_time)}</td>
      <td className="px-5 py-4 text-gray-600">{formatClockTime(advisory.end_time)}</td>
      <td className="px-5 py-4">
        <StatusPill status={advisory.computedStatus} />
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1">
          {advisory.targets.map((t) => (
            <Badge key={t.target_id} bold={false}>
              {t.scope_type === 'entire_cooperative' ? 'Entire Cooperative' : t.target_value}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-5 py-4">
        <RowActions onEdit={() => onEdit(advisory)} onDelete={() => onDelete(advisory)} />
      </td>
    </tr>
  )
}
