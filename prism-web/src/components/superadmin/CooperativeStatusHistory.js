import StatusBadge from '@/components/StatusBadge'

const DOT = {
  Active: 'bg-green-500',
  'Pending Approval': 'bg-red-500',
  Rejected: 'bg-amber-400',
  Deactivated: 'bg-gray-400',
}

function formatWhen(value) {
  return new Date(value).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// submittedAt is optional: it adds the registration itself as the first event.
export default function CooperativeStatusHistory({ logs, submittedAt }) {
  const hasEvents = logs.length > 0 || submittedAt

  return (
    <>
      <h2 className="mb-4 text-sm font-bold text-gray-900">Status history</h2>

      {!hasEvents ? (
        <p className="text-sm text-gray-500">No status changes recorded yet.</p>
      ) : (
        <ol className="relative space-y-5 border-l border-gray-200 pl-6">
          {logs.map((log) => (
            <li key={log.id} className="relative">
              <span
                aria-hidden="true"
                className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
                  DOT[log.new_status] || 'bg-gray-300'
                }`}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {log.previous_status && (
                  <>
                    <StatusBadge status={log.previous_status} />
                    <span className="text-xs text-gray-400" aria-label="changed to">
                      →
                    </span>
                  </>
                )}
                <StatusBadge status={log.new_status} />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">{formatWhen(log.changed_at)}</p>
            </li>
          ))}

          {submittedAt && (
            <li className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white"
              />
              <p className="text-sm font-medium text-gray-800">Registration submitted</p>
              <p className="mt-1 text-xs text-gray-400">{formatWhen(submittedAt)}</p>
            </li>
          )}
        </ol>
      )}
    </>
  )
}