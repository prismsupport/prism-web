import StatusPill from "@/components/ui/StatusPill"

export default function JobOrderStatusLog({ logs }) {
  if (!logs || logs.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-3">Job Order Status Log</h2>
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
          >
            <StatusPill status={log.new_status} />
            <p className="text-xs text-gray-400">
              Status Updated:{' '}
              {new Date(log.changed_at).toLocaleTimeString('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}