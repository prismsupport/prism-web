export function average(values) {
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null
}

export function normKey(value) {
  return String(value || '').trim().toLowerCase()
}

export function sortedEntries(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

export function sourceLabel(source) {
  if (source === 'consumer') return 'reopened by consumer'
  if (source === 'supervisor') return 'reopened by supervisor'
  if (source === 'qa_rejection') return 'reopened after QA rejection'
  return `reopened from ${String(source).replace(/_/g, ' ')}`
}

// Report counts per bucket: daily for 7 days, 6-day periods for 30 and 90
// days, and the last 12 months for all time.
export function buildTrend(reports, rangeDays) {
  const now = new Date()
  const times = reports.map((r) => new Date(r.created_at).getTime())
  const inside = (start, end) => times.filter((t) => t >= start.getTime() && t < end.getTime()).length

  if (rangeDays === null) {
    const out = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      out.push({
        label: start.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
        count: inside(start, end),
      })
    }
    return out
  }

  const step = rangeDays === 7 ? 1 : 6
  const buckets = rangeDays / step
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const out = []
  for (let k = 0; k < buckets; k++) {
    const start = new Date(todayStart)
    start.setDate(start.getDate() - ((buckets - 1 - k) * step + (step - 1)))
    const end = new Date(start)
    end.setDate(end.getDate() + step)
    out.push({
      label:
        step === 1
          ? start.toLocaleDateString('en-PH', { weekday: 'short' })
          : start.toLocaleDateString('en-PH', { day: 'numeric', month: 'short' }),
      count: inside(start, end),
    })
  }
  return out
}

export function trendSubtitle(rangeKey) {
  if (rangeKey === '7') return 'Reports per day, last 7 days'
  if (rangeKey === 'all') return 'Reports per month, last 12 months'
  return `Reports per 6-day period, last ${rangeKey} days`
}