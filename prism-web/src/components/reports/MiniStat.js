export default function MiniStat({ label, value, tone = 'text-gray-900', foot }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`font-display mt-1 text-3xl font-extrabold tabular-nums ${tone}`}>{value}</p>
      {foot ? <p className="mt-0.5 text-xs">{foot}</p> : null}
    </div>
  )
}