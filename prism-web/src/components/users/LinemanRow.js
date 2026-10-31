import { summarizeSchedule } from '@/lib/lineman/schedule'
import { formatLastSeen, DUTY_BADGES } from '@/lib/lineman/duty'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function LinemanRow({ lineman, duty, onSelect }) {
  const shifts = summarizeSchedule(lineman.schedule)
  const badge = duty ? DUTY_BADGES[duty.availability_reason] : null

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-medium text-gray-900">
        {lineman.first_name} {lineman.last_name}
      </td>
      <td className="px-5 py-4 text-gray-600">{lineman.assigned_area_office || '—'}</td>
      <td className="px-5 py-4 text-center">
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
      <td className="px-5 py-4">
        {!lineman.is_active ? (
          <span className="text-xs text-gray-400">Deactivated</span>
        ) : badge ? (
          <div>
            <Badge colorClass={badge.cls} className="inline-block">
              {badge.label}
            </Badge>
            {duty.on_call && (
              <Badge tone="amberStrong" className="ml-1 inline-block">
                ON-CALL
              </Badge>
            )}
            <p className="text-xs text-gray-400 mt-1">{formatLastSeen(duty.location_updated_at)}</p>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-5 py-4 text-gray-600">{lineman.phone_number}</td>
      <td className="px-5 py-4">
        <Button type="button" variant="neutral" size="row" dim={false} onClick={() => onSelect(lineman)}>
          View Details
        </Button>
      </td>
    </tr>
  )
}
