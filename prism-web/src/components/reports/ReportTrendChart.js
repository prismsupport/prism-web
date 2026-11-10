const UNIT_TEXT = { day: 'per day', week: 'per week', month: 'per month' }

function Tile({ label, value, foot }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="font-display mt-0.5 text-2xl font-extrabold tabular-nums text-gray-900">{value}</p>
      {foot ? <p className="text-xs text-gray-400">{foot}</p> : null}
    </div>
  )
}

export default function ReportTrendChart({ data, unit }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((n, d) => n + d.count, 0)
  const peakIndex = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0)
  const avg = data.length > 0 ? total / data.length : 0
  const dense = data.length > 16
  const every = Math.ceil(data.length / 8)

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Tile label="Total reports" value={total} />
        <Tile label={`Average ${UNIT_TEXT[unit] || ''}`} value={avg.toFixed(1)} />
        <Tile
          label="Busiest"
          value={total > 0 ? data[peakIndex].count : '—'}
          foot={total > 0 ? data[peakIndex].label : ''}
        />
      </div>

      <div className="relative min-h-[14rem] flex-1">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-gray-100" />
          ))}
        </div>
        <div className={`absolute inset-0 flex items-end ${dense ? 'gap-1' : 'gap-3'}`}>
          {data.map((d, i) => {
            const isPeak = total > 0 && i === peakIndex
            return (
              <div
                key={`${d.label}-${i}`}
                title={`${d.label}: ${d.count}`}
                className="group flex h-full flex-1 flex-col items-center justify-end"
              >
                {!dense && <span className="mb-1 text-xs font-semibold text-gray-700">{d.count}</span>}
                <div
                  className={`w-full rounded-t-lg transition-colors ${
                    isPeak ? 'bg-blue-700' : 'bg-blue-200 group-hover:bg-blue-400'
                  }`}
                  style={{ height: `${Math.max(3, (d.count / max) * 80)}%` }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className={`mt-2 flex ${dense ? 'gap-1' : 'gap-3'}`}>
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`} className="flex-1 text-center text-[11px] text-gray-400">
            {i % every === 0 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}