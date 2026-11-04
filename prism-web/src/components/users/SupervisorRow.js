import Badge from '@/components/ui/Badge'
import ViewAction from '@/components/ui/ViewAction'

const FEATURE_LABELS = {
  dispatch: 'Dispatch',
  advisories: 'Advisories + Service Areas',
  faq: 'FAQ',
  billing: 'Billing Requests',
}

export default function SupervisorRow({ supervisor, currentUserId, onSelect }) {
  const isSelf = supervisor.id === currentUserId

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 text-center font-medium text-gray-900">
        {supervisor.first_name} {supervisor.last_name}
        {isSelf && <span className="ml-2 text-xs text-gray-400">(You)</span>}
      </td>
      <td className="px-5 py-4 text-center align-middle">
        {supervisor.is_owner ? (
          <div className="flex justify-center">
            <Badge tone="blueStrong">OWNER</Badge>
          </div>
        ) : supervisor.feature_access?.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1">
            {supervisor.feature_access.map((f) => (
              <Badge key={f} tone="gray" bold={false} className="capitalize">
                {FEATURE_LABELS[f] || f}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400">No access granted</span>
        )}
      </td>
      <td className="px-5 py-4 text-center text-gray-600">{supervisor.phone_number}</td>
      <td className="px-5 py-4 text-center">
        <ViewAction onClick={() => onSelect(supervisor)} label="View supervisor details" />
      </td>
    </tr>
  )
}
