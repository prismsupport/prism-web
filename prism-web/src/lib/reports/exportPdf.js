// Builds the PDF for the Reports page from the data already on screen.
// Charts are drawn as plain rectangles (no screenshots), so the file stays
// small and sharp. Uses only characters the built-in PDF font supports.

import { formatMinutes } from '@/lib/performance'
import { STAGES, formatDuration } from '@/lib/stageTimes'

const M = 14 // page margin, mm
const PAGE_W = 210
const PAGE_H = 297
const BOTTOM = PAGE_H - 18
const CONTENT_W = PAGE_W - M * 2

const BLUE = [15, 75, 162]
const LIGHT = [198, 220, 255]
const INK = [12, 24, 43]
const MUTED = [101, 115, 135]
const TRACK = [239, 245, 253]

const LOCATION_VIEWS = [
  ['barangay', 'By barangay'],
  ['municipality', 'By municipality'],
  ['feeder', 'By feeder'],
  ['substation', 'By substation'],
  ['area_office', 'By area office'],
]

const UNIT_TEXT = { day: 'per day', week: 'per week', month: 'per month' }

function safeName(text) {
  return String(text || 'cooperative')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export async function exportReportToPdf(data, meta) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = M

  // ---- helpers ----
  const ensure = (needed) => {
    if (y + needed > BOTTOM) {
      doc.addPage()
      y = M
    }
  }

  const fit = (text, maxW) => {
    let t = String(text ?? '')
    if (doc.getTextWidth(t) <= maxW) return t
    while (t.length > 1 && doc.getTextWidth(t + '...') > maxW) t = t.slice(0, -1)
    return t + '...'
  }

  const heading = (text, note) => {
    ensure(note ? 20 : 14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...BLUE)
    doc.text(text, M, y + 4)
    doc.setDrawColor(...LIGHT)
    doc.line(M, y + 6.5, PAGE_W - M, y + 6.5)
    y += 10
    if (note) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...MUTED)
      const lines = doc.splitTextToSize(note, CONTENT_W)
      doc.text(lines, M, y + 2)
      y += lines.length * 3.6 + 2
    }
  }

  const subheading = (text) => {
    ensure(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text(text, M, y + 3)
    y += 6
  }

  const emptyNote = (text) => {
    ensure(8)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(text, M, y + 3)
    y += 8
  }

  const table = (head, body, columnStyles = {}) => {
    ensure(20)
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      margin: { left: M, right: M, bottom: 18 },
      styles: { fontSize: 8, cellPadding: 1.8, textColor: INK },
      headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 250, 255] },
      columnStyles,
    })
    y = (doc.lastAutoTable?.finalY ?? y) + 6
  }

  // Ranked horizontal bars. rows = [[label, count], ...]
  const barList = (rows, limit = 8) => {
    if (!rows || rows.length === 0) return emptyNote('No data for this selection.')
    const shown = rows.slice(0, limit)
    const max = Math.max(...shown.map(([, c]) => c), 1)
    const labelW = 72
    const countW = 12
    const barX = M + labelW
    const barMax = CONTENT_W - labelW - countW

    doc.setFontSize(8)
    shown.forEach(([label, count]) => {
      ensure(6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...INK)
      doc.text(fit(label, labelW - 3), M, y + 3.6)
      doc.setFillColor(...TRACK)
      doc.rect(barX, y + 1, barMax, 3.4, 'F')
      doc.setFillColor(...BLUE)
      doc.rect(barX, y + 1, Math.max(0.6, (count / max) * barMax), 3.4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.text(String(count), PAGE_W - M, y + 3.6, { align: 'right' })
      y += 6
    })
    if (rows.length > limit) {
      ensure(5)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...MUTED)
      doc.text(`Showing the top ${limit} of ${rows.length}.`, M, y + 3)
      y += 5
    }
    y += 3
  }

  // Vertical bars for the outage-frequency trend
  const trendChart = (trend, unit) => {
    const total = trend.reduce((n, d) => n + d.count, 0)
    if (total === 0) return emptyNote('No reports in this period.')

    const chartH = 38
    ensure(chartH + 18)

    const peak = trend.reduce((best, d, i) => (d.count > trend[best].count ? i : best), 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(
      `${total} reports, ${UNIT_TEXT[unit] || ''}. Busiest: ${trend[peak].label} (${trend[peak].count}).`,
      M,
      y + 3
    )
    y += 8

    const max = Math.max(...trend.map((d) => d.count), 1)
    const n = trend.length
    const gap = n > 30 ? 0.4 : 1
    const bw = (CONTENT_W - gap * (n - 1)) / n
    const showCounts = n <= 16
    const every = Math.ceil(n / 8)

    doc.setFontSize(7)
    trend.forEach((d, i) => {
      const x = M + i * (bw + gap)
      const bh = d.count > 0 ? Math.max(0.8, (d.count / max) * chartH) : 0
      doc.setFillColor(...(i === peak ? BLUE : LIGHT))
      if (bh > 0) doc.rect(x, y + chartH - bh, bw, bh, 'F')
      if (showCounts && d.count > 0) {
        doc.setTextColor(...INK)
        doc.text(String(d.count), x + bw / 2, y + chartH - bh - 1, { align: 'center' })
      }
      if (i % every === 0) {
        doc.setTextColor(...MUTED)
        doc.text(d.label, x + bw / 2, y + chartH + 4, { align: 'center' })
      }
    })
    doc.setDrawColor(...LIGHT)
    doc.line(M, y + chartH, PAGE_W - M, y + chartH)
    y += chartH + 10
  }

  // ---- Title block ----
  const s = data.summary

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...BLUE)
  doc.text('PRISM Outage Report', M, y + 6)
  y += 11
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text(meta.cooperativeName || '-', M, y + 3)
  y += 8

  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  const info = [
    `Period: ${meta.periodLabel}`,
    ...meta.filters.map((f) => `${f.label}: ${f.value}`),
    `Generated: ${meta.generatedAt}`,
  ]
  const infoLines = doc.splitTextToSize(info.join('   |   '), CONTENT_W)
  doc.text(infoLines, M, y + 2)
  y += infoLines.length * 4 + 4

  if (data.truncated) {
    emptyNote('More than 20,000 records matched, so figures cover the most recent ones.')
  }

  // ---- Summary ----
  const dash = (v) => (v == null ? '-' : v)
  heading('Summary')
  table(
    ['Measure', 'Value', 'Measure', 'Value'],
    [
      ['Total outage reports', s.totalReports, 'Avg. response time', formatMinutes(s.avgResponse)],
      ['Declined reports', s.declinedReports, 'Avg. repair time', formatMinutes(s.avgRepair)],
      ['Resolved reports', s.resolvedReports, 'Avg. resolution time', formatMinutes(s.avgResolution)],
      ['Not yet resolved', s.unresolvedReports, 'Dispatched within limit', s.responsePct != null ? `${s.responsePct}%` : '-'],
      ['Reopened tickets', s.reopenedCount, 'Resolved within target', s.resolutionPct != null ? `${s.resolutionPct}%` : '-'],
    ],
    { 1: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'right', fontStyle: 'bold' } }
  )

  // ---- Outage frequency ----
  heading('Outage Frequency', 'Reports filed over the selected period.')
  trendChart(data.trend, data.trendUnit)

  // ---- Issue categories ----
  heading('Issue Categories', 'Category chosen by the consumer. Older reports show as Uncategorized.')
  barList(data.issues, 10)

  // ---- Affected locations ----
  heading(
    'Affected Locations',
    'Reports per area. Feeder, substation and area office come from the cooperative\'s Service Areas; reports in unlisted barangays show as Unmapped.'
  )
  LOCATION_VIEWS.forEach(([key, title]) => {
    subheading(title)
    barList(data.locations[key], 6)
  })

  // ---- Response and resolution times ----
  heading(
    'Response and Resolution Times',
    'Response is submission to first dispatch. Repair is first dispatch to completion. Resolution is submission to final completion.'
  )
  table(
    ['Measure', 'Average', 'What it measures'],
    [
      ['Response time', formatMinutes(s.avgResponse), 'Submission to first dispatch'],
      ['Repair time', formatMinutes(s.avgRepair), 'First dispatch to completion'],
      ['Resolution time', formatMinutes(s.avgResolution), 'Submission to final completion'],
      [
        'Dispatched within limit',
        s.responsePct != null ? `${s.responsePct}%` : '-',
        s.thresholdMinutes ? `Response threshold: ${s.thresholdMinutes} min` : 'No response threshold set',
      ],
      [
        'Resolved within target',
        s.resolutionPct != null ? `${s.resolutionPct}%` : '-',
        s.targetMinutes
          ? `Target: ${formatMinutes(s.targetMinutes)} (${s.resolutionCount} resolved)`
          : 'No resolution target set',
      ],
    ],
    { 1: { halign: 'right', fontStyle: 'bold' } }
  )
  subheading('Average time per stage')
  const stageRows = STAGES.map((st) => [st.label, formatDuration(data.stageAverages[st.key]), st.hint])
  table(['Stage', 'Average', 'What it measures'], stageRows, { 1: { halign: 'right', fontStyle: 'bold' } })

  // ---- Recurring incidents ----
  heading(
    'Recurring Incidents',
    `The same category reported 3 or more times in the same barangay within the selected period. ${s.reopenedCount} ticket${s.reopenedCount === 1 ? ' was' : 's were'} reopened in this period.`
  )
  if (data.recurring.length === 0) {
    emptyNote('No recurring incidents in this selection.')
  } else {
    table(
      ['Category', 'Barangay', 'Municipality', 'Reports'],
      data.recurring.map((g) => [g.label, g.barangay || '-', g.municipality || '-', g.count]),
      { 3: { halign: 'right', fontStyle: 'bold' } }
    )
  }

  // ---- Lineman performance ----
  heading(
    'Lineman Performance',
    'Resolved jobs on the reports above. Read each average together with its rating count.'
  )
  if (data.linemen.length === 0) {
    emptyNote('No lineman accounts yet.')
  } else {
    table(
      ['Lineman', 'Area office', 'Jobs', 'Avg. repair', 'Avg. travel', 'Avg. on-site', 'Rating', 'Ratings'],
      data.linemen.map((l) => [
        l.isActive ? l.name : `${l.name} (inactive)`,
        l.areaOffice || '-',
        l.jobsCompleted,
        formatMinutes(l.avgRepair),
        formatDuration(l.avgTravel),
        formatDuration(l.avgOnSite),
        l.ratingCount > 0 ? l.ratingAverage.toFixed(1) : '-',
        l.ratingCount,
      ]),
      {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      }
    )
  }

  // ---- Footer on every page ----
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`PRISM - ${meta.cooperativeName || ''}`, M, PAGE_H - 8)
    doc.text(`Page ${i} of ${pages}`, PAGE_W - M, PAGE_H - 8, { align: 'right' })
  }

  const day = new Date().toISOString().slice(0, 10)
  doc.save(`PRISM-Report-${safeName(meta.cooperativeName)}-${day}.pdf`)
}