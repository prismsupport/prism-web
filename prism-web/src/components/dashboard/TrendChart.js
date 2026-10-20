export default function TrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((n, d) => n + d.count, 0);
  const peakIndex = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0);

  return (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        <span className="font-display text-lg font-extrabold text-gray-900">{total}</span> reports
        in 7 days
        {total > 0 && (
          <>
            {" "}· busiest day: <span className="font-semibold text-gray-700">{data[peakIndex].label}</span>
          </>
        )}
      </p>

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-40 flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-gray-100" />
          ))}
        </div>
        <div className="relative flex h-40 items-end gap-3">
          {data.map((d, i) => {
            const isPeak = total > 0 && i === peakIndex;
            return (
              <div
                key={d.label}
                title={`${d.label}: ${d.count}`}
                className="group flex h-full flex-1 flex-col items-center justify-end"
              >
                <span className="mb-1 text-xs font-semibold text-gray-700">{d.count}</span>
                <div
                  className={`w-full rounded-t-lg transition-colors ${
                    isPeak ? "bg-blue-700" : "bg-blue-200 group-hover:bg-blue-400"
                  }`}
                  style={{ height: `${Math.max(3, (d.count / max) * 80)}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] text-gray-400">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}