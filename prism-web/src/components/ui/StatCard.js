export default function StatCard({
  label,
  value,
  color = 'text-gray-900',
  active,
  onClick,
  compact = false,
  hint,
  labelTracking = 'tracking-wide',
}) {
  const clickable = typeof onClick === 'function'
  const padding = compact ? 'p-4' : 'p-5'

  const content = (
    <>
      <p className={`text-xs font-bold ${labelTracking} text-gray-400 uppercase mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </>
  )

  if (!clickable) {
    return <div className={`bg-white rounded-xl border border-gray-200 ${padding}`}>{content}</div>
  }

  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-xl border ${padding} transition-all ${
        active
          ? 'border-blue-600 ring-1 ring-blue-600'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {content}
    </button>
  )
}

const COLUMNS = {
  4: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6',
  5: 'grid grid-cols-2 md:grid-cols-5 gap-4 mb-6',
}

export function StatCardGrid({ columns = 4, className, children }) {
  return <div className={className ?? COLUMNS[columns]}>{children}</div>
}
