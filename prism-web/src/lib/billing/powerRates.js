export const RATE_CLASSES = [
  { key: 'residential', label: 'Residential', hint: 'Residential consumers' },
  { key: 'low_voltage', label: 'Low Voltage', hint: 'Commercial, industrial, irrigation, public buildings, streetlights' },
  { key: 'high_voltage', label: 'High Voltage', hint: 'Industrial and commercial' },
]

export const MAX_PHOTO_MB = 5

export const INPUT =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400'

export const monthLabel = (ym) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })

export const peso = (n) => `₱${Number(n).toFixed(4)}`

export const toNum = (v) =>
  v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v)

export const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function emptyForm() {
  return {
    residential: { total: '', components: [] },
    low_voltage: { total: '', components: [] },
    high_voltage: { total: '', components: [] },
  }
}

// Calculate totals from breakdown components
export function computeTotals(form) {
  const out = {}

  RATE_CLASSES.forEach((c) => {
    const filled = form[c.key].components.filter(
      (x) => x.label.trim() && toNum(x.amount) != null
    )

    out[c.key] = filled.length
      ? Math.round(
          filled.reduce((s, x) => s + Number(x.amount), 0) * 10000
        ) / 10000
      : toNum(form[c.key].total)
  })

  return out
}

// Text for the advisory description, built from the totals and last month's rates
export function buildAdvisoryDescription(totals, previous, month) {
  const lines = RATE_CLASSES.filter(
    (c) => totals[c.key] != null
  ).map((c) => {
    const prev = previous[c.key]

    let line = `${c.label} rate for ${monthLabel(month)} is ${peso(totals[c.key])}/kWh`

    if (prev) {
      const diff =
        Math.round(
          (totals[c.key] - Number(prev.total_rate)) * 10000
        ) / 10000

      line +=
        diff === 0
          ? `, unchanged from ${monthLabel(prev.ym)}`
          : `, ${diff > 0 ? 'up' : 'down'} ${peso(Math.abs(diff))} from ${monthLabel(prev.ym)} (${peso(prev.total_rate)}/kWh)`
    }

    return line + '.'
  })

  return lines.join('\n')
}