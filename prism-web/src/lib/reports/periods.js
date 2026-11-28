import { toDateInput } from '@/lib/reports/helpers'

const DAY = 86400000

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// The period right before the selected one, with the same number of days.
// Returns null for "All time" (no start date, so nothing comes before it).
export function previousPeriod(fromDate, toDate) {
  if (!fromDate) return null
  const fromDay = startOfDay(fromDate)
  const endDay = startOfDay(toDate && toDate < new Date() ? toDate : new Date())
  const spanDays = Math.max(1, Math.round((endDay - fromDay) / DAY) + 1)
  const prevTo = new Date(fromDay)
  prevTo.setDate(prevTo.getDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setDate(prevFrom.getDate() - (spanDays - 1))
  return { from: toDateInput(prevFrom), to: toDateInput(prevTo) }
}

// Daily buckets up to 31 days, weekly up to 180 days, monthly beyond that.
export function buildTrend(reports, startMs, endMs) {
  const start = new Date(startMs)
  const end = new Date(endMs)
  const days = Math.ceil((endMs - startMs) / DAY)
  const unit = days <= 31 ? 'day' : days <= 180 ? 'week' : 'month'

  const buckets = []
  if (unit === 'month') {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor <= end) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      buckets.push({
        start: cursor,
        end: next,
        label: cursor.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
      })
      cursor = next
    }
  } else {
    const step = unit === 'day' ? 1 : 7
    let cursor = startOfDay(start)
    while (cursor <= end) {
      const next = new Date(cursor)
      next.setDate(next.getDate() + step)
      buckets.push({
        start: cursor,
        end: next,
        label: cursor.toLocaleDateString('en-PH', { day: 'numeric', month: 'short' }),
      })
      cursor = next
    }
  }

  const counts = buckets.map(() => 0)
  reports.forEach((r) => {
    const t = new Date(r.created_at)
    const i = buckets.findIndex((b) => t >= b.start && t < b.end)
    if (i !== -1) counts[i] += 1
  })

  return {
    trendUnit: unit,
    trend: buckets.map((b, i) => ({ label: b.label, count: counts[i] })),
  }
}