// Builds the Excel workbook for the Reports page, from the data the page is
// already showing. One Summary sheet (cooperative, period, filters, headline
// numbers) plus one sheet per report section. Times are in minutes, as numbers,
// so they can be sorted and calculated in Excel.

import { STAGES } from '@/lib/stageTimes'

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4BA2' } }
const LOCATION_TITLES = {
  barangay: 'Barangay',
  municipality: 'Municipality',
  feeder: 'Feeder',
  substation: 'Substation',
  area_office: 'Area office',
}

const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10)
const round2 = (v) => (v == null ? null : Math.round(v * 100) / 100)

function addTable(workbook, name, columns, rows) {
  const sheet = workbook.addWorksheet(name)
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 18 }))

  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = HEADER_FILL
  header.alignment = { vertical: 'middle' }
  header.height = 22

  rows.forEach((r) => sheet.addRow(r))
  columns.forEach((c, i) => {
    if (c.numFmt) sheet.getColumn(i + 1).numFmt = c.numFmt
  })

  if (rows.length === 0) {
    sheet.addRow({ [columns[0].key]: 'No data for this selection.' })
  } else {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  return sheet
}

function addSummarySheet(workbook, data, meta) {
  const sheet = workbook.addWorksheet('Summary')
  sheet.columns = [{ width: 36 }, { width: 44 }]

  const title = sheet.addRow(['PRISM Outage Report'])
  title.font = { bold: true, size: 14 }
  sheet.addRow(['Cooperative', meta.cooperativeName || '—'])
  sheet.addRow(['Generated', meta.generatedAt])
  sheet.addRow([])

  const sectionHeader = (text) => {
    const row = sheet.addRow([text])
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    row.fill = HEADER_FILL
    sheet.mergeCells(row.number, 1, row.number, 2)
  }

  sectionHeader('Filters used')
  sheet.addRow(['Period', meta.periodLabel])
  meta.filters.forEach((f) => sheet.addRow([f.label, f.value]))
  sheet.addRow([])

  const s = data.summary
  sectionHeader('Summary')
  const dash = (v) => (v == null ? '—' : v)
  ;[
    ['Total outage reports', s.totalReports],
    ['Declined reports', s.declinedReports],
    ['Resolved reports', s.resolvedReports],
    ['Not yet resolved', s.unresolvedReports],
    ['Reopened tickets', s.reopenedCount],
    ['Avg. response time (min)', dash(round1(s.avgResponse))],
    ['Avg. repair time (min)', dash(round1(s.avgRepair))],
    ['Avg. resolution time (min)', dash(round1(s.avgResolution))],
    [
      s.thresholdMinutes
        ? `Dispatched within ${s.thresholdMinutes} min (%)`
        : 'Dispatched within response threshold (%)',
      dash(s.responsePct),
    ],
    [
      s.targetMinutes
        ? `Resolved within ${s.targetMinutes} min target (%)`
        : 'Resolved within resolution target (%)',
      dash(s.resolutionPct),
    ],
  ].forEach(([label, value]) => {
    const row = sheet.addRow([label, value])
    row.getCell(2).alignment = { horizontal: 'left' }
  })

  if (data.truncated) {
    sheet.addRow([])
    sheet.addRow(['Note', 'More than 20,000 records matched, so figures cover the most recent ones.'])
  }
}

export async function buildReportWorkbook(data, meta) {
  const mod = await import('exceljs')
  const ExcelJS = mod.default || mod
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'PRISM'
  workbook.created = new Date()

  addSummarySheet(workbook, data, meta)

  addTable(
    workbook,
    'Outage Frequency',
    [
      { header: data.trendUnit === 'month' ? 'Month' : data.trendUnit === 'week' ? 'Week starting' : 'Day', key: 'label', width: 20 },
      { header: 'Reports', key: 'count', width: 12 },
    ],
    data.trend
  )

  const issueTotal = data.issues.reduce((n, [, c]) => n + c, 0)
  addTable(
    workbook,
    'Issue Categories',
    [
      { header: 'Category', key: 'name', width: 42 },
      { header: 'Reports', key: 'count', width: 12 },
      { header: 'Share', key: 'share', width: 12, numFmt: '0.0%' },
    ],
    data.issues.map(([name, count]) => ({ name, count, share: issueTotal ? count / issueTotal : 0 }))
  )

  const locationRows = []
  Object.keys(LOCATION_TITLES).forEach((key) => {
    ;(data.locations[key] || []).forEach(([name, count]) => {
      locationRows.push({ group: LOCATION_TITLES[key], name, count })
    })
  })
  addTable(
    workbook,
    'Affected Locations',
    [
      { header: 'Grouped by', key: 'group', width: 18 },
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Reports', key: 'count', width: 12 },
    ],
    locationRows
  )

  const s = data.summary
  const timeRows = [
    { measure: 'Avg. response time', minutes: round1(s.avgResponse), note: 'Submission to first dispatch' },
    { measure: 'Avg. repair time', minutes: round1(s.avgRepair), note: 'First dispatch to completion' },
    { measure: 'Avg. resolution time', minutes: round1(s.avgResolution), note: 'Submission to final completion' },
  ]
  STAGES.forEach((st) => {
    timeRows.push({
      measure: `Stage: ${st.label}`,
      minutes: round1(data.stageAverages[st.key]),
      note: st.hint,
    })
  })
  addTable(
    workbook,
    'Response & Resolution',
    [
      { header: 'Measure', key: 'measure', width: 34 },
      { header: 'Average (min)', key: 'minutes', width: 16, numFmt: '0.0' },
      { header: 'What it measures', key: 'note', width: 44 },
    ],
    timeRows
  )

  addTable(
    workbook,
    'Recurring Incidents',
    [
      { header: 'Category', key: 'label', width: 42 },
      { header: 'Barangay', key: 'barangay', width: 24 },
      { header: 'Municipality', key: 'municipality', width: 24 },
      { header: 'Reports', key: 'count', width: 12 },
    ],
    data.recurring
  )

  addTable(
    workbook,
    'Lineman Performance',
    [
      { header: 'Lineman', key: 'name', width: 28 },
      { header: 'Area office', key: 'areaOffice', width: 24 },
      { header: 'Jobs completed', key: 'jobs', width: 16 },
      { header: 'Avg. repair (min)', key: 'repair', width: 18, numFmt: '0.0' },
      { header: 'Avg. travel (min)', key: 'travel', width: 18, numFmt: '0.0' },
      { header: 'Avg. on-site (min)', key: 'onSite', width: 18, numFmt: '0.0' },
      { header: 'Avg. rating', key: 'rating', width: 14, numFmt: '0.00' },
      { header: 'Ratings', key: 'ratings', width: 10 },
    ],
    data.linemen.map((l) => ({
      name: l.isActive ? l.name : `${l.name} (inactive)`,
      areaOffice: l.areaOffice || '—',
      jobs: l.jobsCompleted,
      repair: round1(l.avgRepair),
      travel: round1(l.avgTravel),
      onSite: round1(l.avgOnSite),
      rating: round2(l.ratingAverage),
      ratings: l.ratingCount,
    }))
  )

  return workbook
}

function safeName(text) {
  return String(text || 'cooperative')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export async function exportReportToExcel(data, meta) {
  const workbook = await buildReportWorkbook(data, meta)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const day = new Date().toISOString().slice(0, 10)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `PRISM-Report-${safeName(meta.cooperativeName)}-${day}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}