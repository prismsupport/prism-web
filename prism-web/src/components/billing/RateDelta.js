import { peso } from '@/lib/billing/powerRates'

export default function RateDelta({ current, previous }) {
  if (current == null || previous == null) return null

  const diff = Math.round((current - previous) * 10000) / 10000

  if (diff === 0) {
    return (
      <span className="text-xs text-gray-400">
        No change from last month
      </span>
    )
  }

  const up = diff > 0

  return (
    <span className={`text-xs font-semibold ${up ? 'text-red-600' : 'text-green-600'}`}>
      {up ? '▲' : '▼'} {peso(Math.abs(diff))} vs last month ({peso(previous)})
    </span>
  )
}