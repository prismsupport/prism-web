import { STAGES, formatDuration, slowestStageKey } from '@/lib/stageTimes'

const BAR = {
  waiting: 'bg-red-400',
  dispatchToStart: 'bg-amber-400',
  travel: 'bg-orange-500',
  onSite: 'bg-blue-600',
  approval: 'bg-green-500',
}

export default function StageBreakdown({ averages }) {
  const total = STAGES.reduce((n, s) => n + (averages[s.key] || 0), 0)
  const slowest = slowestStageKey(averages)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Average Time per Stage</h2>
      <p className="text-xs text-gray-400 mb-4">
        Where repair time goes, from report submission to supervisor approval. Waiting for
        dispatch is averaged per ticket; the other stages per job order.
      </p>

      {total === 0 ? (
        <p className="text-sm text-gray-500">No stage data in this period yet.</p>
      ) : (
        <>
          <div className="mb-5 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            {STAGES.map(
              (s) =>
                (averages[s.key] || 0) > 0 && (
                  <div
                    key={s.key}
                    title={`${s.label}: ${formatDuration(averages[s.key])}`}
                    className={BAR[s.key]}
                    style={{ width: `${(averages[s.key] / total) * 100}%` }}
                  />
                )
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STAGES.map((s) => (
              <div
                key={s.key}
                className={`rounded-xl border p-3 ${
                  slowest === s.key ? 'border-amber-300 bg-amber-50/40' : 'border-gray-100'
                }`}
              >
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`h-2 w-2 rounded-full ${BAR[s.key]}`} />
                  {s.label}
                </p>
                <p className="font-display mt-1 text-xl font-extrabold tabular-nums text-gray-900">
                  {formatDuration(averages[s.key])}
                </p>
                {slowest === s.key && (
                  <p className="text-[10px] font-bold text-amber-700 mt-0.5">SLOWEST STAGE</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}