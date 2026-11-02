import EmptyState from '@/components/ui/EmptyState'

// Ranked horizontal bars. rows = [[label, count], ...] already sorted.
export default function BarList({ rows, limit = 8, emptyTitle, emptyDescription }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }
  const shown = rows.slice(0, limit)
  const max = Math.max(...shown.map(([, c]) => c), 1)

  return (
    <div>
      <div className="space-y-4">
        {shown.map(([label, count], i) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-gray-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[11px] font-bold text-gray-500">
                  {i + 1}
                </span>
                <span className="truncate">{label}</span>
              </span>
              <span className="font-display font-bold tabular-nums text-gray-900">{count}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-blue-700"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {rows.length > limit && (
        <p className="mt-4 text-xs text-gray-400">
          Showing the top {limit} of {rows.length}.
        </p>
      )}
    </div>
  )
}