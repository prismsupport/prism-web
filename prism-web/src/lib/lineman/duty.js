// Shared helpers for showing a lineman's live duty status.

export function formatLastSeen(timestamp) {
  if (!timestamp) return 'Never reported'
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return 'Last seen just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Last seen ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Last seen ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `Last seen ${days}d ago`
}

// Badge text and colors for each duty state
export const DUTY_BADGES = {
  on_duty: { label: 'ON DUTY', cls: 'bg-green-50 text-green-700' },
  no_signal: { label: 'NO SIGNAL', cls: 'bg-amber-50 text-amber-700' },
  off_schedule: { label: 'OFF SCHEDULE', cls: 'bg-gray-100 text-gray-600' },
}