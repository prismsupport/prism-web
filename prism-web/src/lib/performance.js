// Shared helpers for lineman performance numbers.

// Start of a period as an ISO string, or null for "all time".
export function periodStartIso(days) {
  if (!days) return null
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export function formatMinutes(minutes) {
  if (minutes == null || isNaN(minutes)) return '—'
  if (minutes < 60) return `${Math.round(minutes)} mins`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}hr ${mins}m`
}

// rows: [{ rating }]
// Returns how many ratings there are, their average (null when there are
// none), and a 1-5 breakdown.
export function summarizeRatings(rows) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0
  let count = 0

  ;(rows || []).forEach((r) => {
    const value = Number(r.rating)
    if (value >= 1 && value <= 5) {
      distribution[value] += 1
      total += value
      count += 1
    }
  })

  return {
    ratingCount: count,
    ratingAverage: count > 0 ? total / count : null,
    distribution,
  }
}