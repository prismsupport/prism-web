import Link from 'next/link'

export default function AttentionCard({ label, count, href, color }) {
  const active = count > 0
  return (
    <Link
      href={href}
      className={`bg-white rounded-xl border p-3 transition-colors ${
        active
          ? 'border-gray-300 hover:border-blue-600'
          : 'border-gray-200 opacity-70 hover:opacity-100'
      }`}
    >
      <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${active ? color : 'text-gray-300'}`}>{count}</p>
    </Link>
  )
}