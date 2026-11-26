import { RANGES } from '@/lib/reports/constants'

export function toDateInput(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function presetDates(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: toDateInput(from), to: toDateInput(to) }
}

// The dates actually used for loading
export function resolvePeriod(rangeKey, customFrom, customTo) {
  let from = null
  let to = null
  if (rangeKey === 'custom') {
    from = customFrom || null
    to = customTo || null
  } else {
    const range = RANGES.find((r) => r.key === rangeKey)
    if (range?.days) ({ from, to } = presetDates(range.days))
  }
  return { from, to }
}

export function dateRangeError(from, to) {
  return from && to && from > to ? 'The start date must be on or before the end date.' : ''
}

// Colour by position in the cooperative's own priority list (lowest to highest)
export function priorityBar(label, levels) {
  const i = levels.findIndex((l) => l.label === label)
  if (i === -1) return 'bg-gray-300' // "Not set"
  if (levels.length === 1) return 'bg-blue-600'
  const pos = i / (levels.length - 1)
  if (pos >= 1) return 'bg-red-600'
  if (pos >= 0.6) return 'bg-red-400'
  if (pos >= 0.3) return 'bg-amber-400'
  return 'bg-blue-400'
}