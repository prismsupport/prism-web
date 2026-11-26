import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import StatusPill from '@/components/ui/StatusPill'
import EmptyState from '@/components/ui/EmptyState'

export default function TopLinemanPerformance({ linemen }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900">Top Lineman Performance</h2>
        <Link href="/supervisor/lineman-performance" className="text-xs font-semibold text-blue-700">
          View all
        </Link>
      </div>
      {linemen.length === 0 ? (
        <EmptyState
          title="No completed jobs in this period"
          description="Linemen appear here once they complete jobs."
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {linemen.map((l, i) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-4 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                <Avatar name={`${l.first_name} ${l.last_name}`} size={32} />
                <span className="font-medium text-gray-900">
                  {l.first_name} {l.last_name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  <span className="font-display font-bold tabular-nums text-gray-900">
                    {l.jobsCompleted}
                  </span>{' '}
                  jobs
                </span>
                {l.ratingCount > 0 ? (
                  <span className="text-gray-600">
                    <span className="text-amber-500">★</span> {l.ratingAverage.toFixed(1)}{' '}
                    <span className="text-gray-400">({l.ratingCount})</span>
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">No ratings</span>
                )}
                <StatusPill
                  status={l.is_active ? 'active' : 'deactivated'}
                  label={l.is_active ? 'Active' : 'Inactive'}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}