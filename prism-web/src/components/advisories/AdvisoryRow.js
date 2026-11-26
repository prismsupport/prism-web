
import RowActions from '@/components/ui/RowActions'
import StatusPill from '@/components/ui/StatusPill'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatClockTime, formatDate } from '@/lib/format'
import { categoryOf } from '@/lib/advisoryCategories'

export default function AdvisoryRow({
  advisory,
  archived = false,
  onEdit,
  onDelete,
  onRestore,
  onMarkRestored,
}) {
  const category = categoryOf(advisory.category)

  return (
    <tr className="border-b border-gray-100 last:border-0">
      {/* Advisory Title */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 min-w-0">
          {advisory.photoSignedUrl && (
            <img
              src={advisory.photoSignedUrl}
              alt=""
              className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
            />
          )}

          <span className="font-semibold text-gray-900">
            {advisory.title}
          </span>
        </div>
      </td>

      {/* Category */}
      <td className="px-5 py-4 text-center whitespace-nowrap">
        <Badge tone={category.tone} size="sm" bold={false}>
          {category.label}
        </Badge>
      </td>

      {/* Date */}
      <td className="px-5 py-4 text-center text-gray-600 whitespace-nowrap">
        {formatDate(advisory.date)}
      </td>

      {/* Time */}
      <td className="px-5 py-4 text-center text-gray-600 whitespace-nowrap">
        {category.timed
        ? advisory.end_time
          ? `${formatClockTime(advisory.start_time)} - ${formatClockTime(advisory.end_time)}`
          : `${formatClockTime(advisory.start_time)} - Until restored`
        : 'All day'}
      </td>

      {/* Status */}
      <td className="px-5 py-4 text-center">
        <StatusPill status={advisory.computedStatus} />
      </td>

      {/* Affected Scope */}
      <td className="px-5 py-4 text-center">
        <div className="flex flex-wrap justify-center gap-1">
          {advisory.targets.map((t) => (
            <Badge key={t.target_id} bold={false}>
              {t.scope_type === 'entire_cooperative'
                ? 'Entire Cooperative'
                : t.target_value}
            </Badge>
          ))}
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4 text-center">
        {archived ? (
          <Button
            type="button"
            variant="neutral"
            size="row"
            dim={false}
            onClick={() => onRestore(advisory)}
          >
            Restore
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-3">
            {advisory.category === 'unscheduled_interruption' &&
              !advisory.end_time &&
              advisory.computedStatus === 'active' && (
                <Button
                  type="button"
                  variant="success"
                  size="xs"
                  dim={false}
                  onClick={() => onMarkRestored(advisory)}
                >
                  Mark as Restored
                </Button>
              )}
            <RowActions
              archive
              onEdit={() => onEdit(advisory)}
              onDelete={() => onDelete(advisory)}
            />
          </div>
        )}
      </td>
    </tr>
  )
}
