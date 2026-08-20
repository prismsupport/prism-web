export default function StatCard({ label, value, color = 'text-gray-900', isActive, onClick }) {
  const clickable = typeof onClick === 'function'

  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      className={`text-left bg-white rounded-xl border p-5 transition-all cursor-pointer ${
        isActive
          ? 'border-blue-600 ring-1 ring-blue-600'
          : 'border-gray-200 hover:border-gray-300'
      } ${!clickable ? 'cursor-default' : ''}`}
    >
      <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </button>
  )
}