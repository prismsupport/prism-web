// Shared formatting helpers. 

// "in_progress" -> "In Progress"
export function labelize(value) {
  return String(value)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export const DATE_LONG = { month: 'long', day: 'numeric', year: 'numeric' }
export const DATE_SHORT = { month: 'short', day: 'numeric', year: 'numeric' }
export const DATETIME_SHORT = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
export const DATETIME_LONG = { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }
export const DATETIME_FULL = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}
export const DATETIME_FULL_LONG = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}
export const TIME_SHORT = { hour: 'numeric', minute: '2-digit' }

export function formatDate(value, options = DATE_LONG) {
  return new Date(value).toLocaleDateString('en-PH', options)
}

export function formatDateTime(value, options = DATETIME_SHORT) {
  return new Date(value).toLocaleString('en-PH', options)
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-PH', TIME_SHORT)
}

// "14:30:00" -> "2:30 PM"
export function formatClockTime(timeString) {
  const [h, m] = timeString.split(':')
  const hour = parseInt(h, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${m} ${period}`
}

export function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
