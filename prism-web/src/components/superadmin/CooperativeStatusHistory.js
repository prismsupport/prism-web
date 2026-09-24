import StatusBadge from '@/components/StatusBadge'

export default function CooperativeStatusHistory({ logs }) {
  return (
    <>
      <h2 className="font-semibold text-gray-900 mb-4">Status History</h2>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">
          No status changes recorded yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 last:border-0 pb-3 last:pb-0"
            >
              <div className="flex items-center gap-1.5">
                {log.previous_status && (
                  <>
                    <StatusBadge status={log.previous_status} />
                    <span className="text-gray-400 text-xs">→</span>
                  </>
                )}
                <StatusBadge status={log.new_status} />
              </div>
              <span className="text-xs text-gray-400">
                {new Date(log.changed_at).toLocaleString('en-PH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}