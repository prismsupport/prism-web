// Builds the Excel workbook for the Reports page, from the data the page is
// already showing. A Summary sheet (cooperative, period, filters, key findings,
// headline numbers with the previous-period comparison) plus one sheet per
// report section and a Tickets sheet with one row per report. Times are in
// minutes, as numbers, so they can be sorted and calculated in Excel.

import { STAGES } from '@/lib/stageTimes'

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4BA2' } }
const LOCATION_TITLES = {
  barangay: 'Barangay',
  municipality: 'Municipality',
  feeder: 'Feeder',
  substation: 'Substation',
  area_office: 'Area office',
}
const REOPEN_LABELS = {
  consumer: 'Consumer request',
  supervisor: 'Supervisor',
  qa_rejection: 'QA rejection',
}

const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10)
const round2 = (v) => (v == null ? null : Math.round(v * 100) / 100)
const dash = (v) => (v == null ? '—' : v)
const frac = (pct) => (pct == null ? null : pct / 100)

function humanize(code) {
  return String(code || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Landscape, one page wide, cooperative name in the header, page numbers in the footer
function finishSheet(sheet, meta) {
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  }
  const coop = String(meta.cooperativeName || '').replace(/&/g, '&&')
  sheet.headerFooter = {
    oddHeader: `&L&B${coop}&RPRISM Outage Report`,
    oddFooter: '&LPeriod: ' + String(meta.periodLabel || '').replace(/&/g, '&&') + '&RPage &P of &N',
  }
}

function addDataBar(sheet, colIndex, rowCount) {
  if (rowCount < 1) return
  const letter = sheet.getColumn(colIndex).letter
  try {
    sheet.addConditionalFormatting({
      ref: `${letter}2:${letter}${rowCount + 1}`,
      rules: [
        {
          type: 'dataBar',
          priority: 1,
          gradient: false,
          color: { argb: 'FF9EC4FF' },
          cfvo: [{ type: 'min' }, { type: 'max' }],
        },
      ],
    })
  } catch {
    // data bars are decoration only; never stop the export
  }
}

// opts: { sumKey: column key to total with a SUM formula, barKey: column key to draw data bars on }
function addTable(workbook, meta, name, columns, rows, opts = {}) {
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
    // The filter covers the data rows only, so sorting never moves the total
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: columns.length } }

    if (opts.sumKey) {
      const sumIndex = columns.findIndex((c) => c.key === opts.sumKey) + 1
      const letter = sheet.getColumn(sumIndex).letter
      const total = sheet.addRow({})
      total.getCell(1).value = 'Total'
      total.getCell(sumIndex).value = {
        formula: `SUM(${letter}2:${letter}${rows.length + 1})`,
        result: rows.reduce((n, r) => n + (Number(r[opts.sumKey]) || 0), 0),
      }
      total.font = { bold: true }
      total.border = { top: { style: 'thin', color: { argb: 'FF95A2B4' } } }
    }
    if (opts.barKey) {
      addDataBar(sheet, columns.findIndex((c) => c.key === opts.barKey) + 1, rows.length)
    }
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  finishSheet(sheet, meta)
  return sheet
}

function addSummarySheet(workbook, data, meta) {
  const cmp = data.comparison
  const cols = cmp ? 4 : 2
  const sheet = workbook.addWorksheet('Summary')
  sheet.columns = (cmp ? [{ width: 42 }, { width: 18 }, { width: 24 }, { width: 14 }] : [{ width: 42 }, { width: 44 }])

  const title = sheet.addRow(['PRISM Outage Report'])
  title.font = { bold: true, size: 14 }
  sheet.addRow(['Cooperative', meta.cooperativeName || '—'])
  if (meta.preparedBy?.name) {
    sheet.addRow(['Prepared by', meta.preparedBy.role ? `${meta.preparedBy.name} (${meta.preparedBy.role})` : meta.preparedBy.name])
  }
  sheet.addRow(['Generated', meta.generatedAt])
  sheet.addRow([])

  const sectionHeader = (text) => {
    const row = sheet.addRow([text])
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    row.fill = HEADER_FILL
    sheet.mergeCells(row.number, 1, row.number, cols)
  }

  sectionHeader('Filters used')
  sheet.addRow(['Period', meta.periodLabel])
  meta.filters.forEach((f) => sheet.addRow([f.label, f.value]))
  sheet.addRow([])

  if (data.findings?.length) {
    sectionHeader('Key findings')
    data.findings.forEach((text) => {
      const row = sheet.addRow([`• ${text}`])
      sheet.mergeCells(row.number, 1, row.number, cols)
      row.alignment = { wrapText: true, vertical: 'top' }
      row.height = Math.max(16, Math.ceil(text.length / (cols === 4 ? 90 : 80)) * 15)
    })
    sheet.addRow([])
  }

  const s = data.summary
  const pv = cmp?.previous
  const d = cmp?.deltas || {}
  sectionHeader('Summary')

  const head = sheet.addRow(
    cmp ? ['Measure', 'This period', `Previous (${cmp.from} to ${cmp.to})`, 'Change'] : ['Measure', 'Value']
  )
  head.font = { bold: true }
  head.eachCell((c) => {
    c.border = { bottom: { style: 'thin', color: { argb: 'FF95A2B4' } } }
  })

  // [label, current, previous, delta, numFmt]
  const rows = [
    ['Total outage reports', s.totalReports, pv?.totalReports, d.totalReports],
    ['Declined reports', s.declinedReports, pv?.declinedReports],
    ['Resolved reports', s.resolvedReports, pv?.resolvedReports, d.resolvedReports],
    ['Not yet resolved', s.unresolvedReports, pv?.unresolvedReports],
    ['Reopened tickets', s.reopenedCount, pv?.reopenedCount, d.reopenedCount],
    ['Avg. response time (min)', round1(s.avgResponse), round1(pv?.avgResponse), d.avgResponse, '0.0'],
    ['Avg. repair time (min)', round1(s.avgRepair), round1(pv?.avgRepair), null, '0.0'],
    ['Avg. resolution time (min)', round1(s.avgResolution), round1(pv?.avgResolution), d.avgResolution, '0.0'],
    [
      s.thresholdMinutes
        ? `Dispatched within ${s.thresholdMinutes} min`
        : 'Dispatched within response threshold',
      frac(s.responsePct),
      frac(pv?.responsePct),
      null,
      '0%',
    ],
    [
      s.targetMinutes
        ? `Resolved within ${s.targetMinutes} min target`
        : 'Resolved within resolution target',
      frac(s.resolutionPct),
      frac(pv?.resolutionPct),
      null,
      '0%',
    ],
  ]

  const putRow = ([label, cur, prev, delta, fmt]) => {
    const row = sheet.addRow(cmp ? [label, dash(cur), dash(prev), delta?.pct != null ? delta.pct / 100 : '—'] : [label, dash(cur)])
    row.getCell(2).alignment = { horizontal: 'left' }
    if (fmt) {
      row.getCell(2).numFmt = fmt
      if (cmp) row.getCell(3).numFmt = fmt
    }
    if (cmp) {
      row.getCell(3).alignment = { horizontal: 'left' }
      row.getCell(4).alignment = { horizontal: 'left' }
      if (delta?.pct != null) row.getCell(4).numFmt = '+0%;-0%;0%'
    }
  }
  rows.forEach(putRow)

  if (!cmp) {
    const note = sheet.addRow(['Comparison', 'Not available for "All time" or when the previous period could not be loaded.'])
    note.font = { italic: true, color: { argb: 'FF657387' } }
  }

  sheet.addRow([])
  sectionHeader('Reopened tickets and consolidation')
  const sources = Object.entries(s.reopenSources || {})
  if (sources.length === 0) {
    sheet.addRow(['Reopens', 'None in this period'])
  } else {
    sources.forEach(([src, n]) => sheet.addRow([`Reopens: ${REOPEN_LABELS[src] || humanize(src)}`, n]).getCell(2).alignment = { horizontal: 'left' })
  }
  const c = data.consolidation
  ;[
    ['Reports merged into Master Tickets', c.mergedReports],
    ['Master Tickets', c.masterTickets],
    ['Duplicate dispatches avoided', c.dispatchesAvoided],
  ].forEach(([label, v]) => {
    sheet.addRow([label, v]).getCell(2).alignment = { horizontal: 'left' }
  })

  if (data.truncated) {
    sheet.addRow([])
    sheet.addRow(['Note', 'More than 20,000 records matched, so figures cover the most recent ones.'])
  }
  finishSheet(sheet, meta)
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
    meta,
    'Outage Frequency',
    [
      { header: data.trendUnit === 'month' ? 'Month' : data.trendUnit === 'week' ? 'Week starting' : 'Day', key: 'label', width: 20 },
      { header: 'Reports', key: 'count', width: 12 },
    ],
    data.trend,
    { sumKey: 'count', barKey: 'count' }
  )

  const issueTotal = data.issues.reduce((n, [, c]) => n + c, 0)
  addTable(
    workbook,
    meta,
    'Issue Categories',
    [
      { header: 'Category', key: 'name', width: 42 },
      { header: 'Reports', key: 'count', width: 12 },
      { header: 'Share', key: 'share', width: 12, numFmt: '0.0%' },
    ],
    data.issues.map(([name, count]) => ({ name, count, share: issueTotal ? count / issueTotal : 0 })),
    { sumKey: 'count', barKey: 'count' }
  )

  // Priority and status, one sheet
  const statusName = (k) => (meta.statusLabel ? meta.statusLabel(k) : humanize(k))
  const priorityTotal = data.byPriority.reduce((n, p) => n + p.count, 0)
  const statusTotal = data.byStatus.reduce((n, p) => n + p.count, 0)
  addTable(
    workbook,
    meta,
    'Priority & Status',
    [
      { header: 'Grouped by', key: 'group', width: 16 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Reports', key: 'count', width: 12 },
      { header: 'Share', key: 'share', width: 12, numFmt: '0.0%' },
    ],
    [
      ...data.byPriority.map((p) => ({
        group: 'Priority',
        name: p.label,
        count: p.count,
        share: priorityTotal ? p.count / priorityTotal : 0,
      })),
      ...data.byStatus.map((p) => ({
        group: 'Status',
        name: statusName(p.key),
        count: p.count,
        share: statusTotal ? p.count / statusTotal : 0,
      })),
    ],
    { barKey: 'count' }
  )

  const locationRows = []
  Object.keys(LOCATION_TITLES).forEach((key) => {
    ;(data.locations[key] || []).forEach(([name, count]) => {
      locationRows.push({ group: LOCATION_TITLES[key], name, count })
    })
  })
  // No total row here: every report is counted once under each grouping
  addTable(
    workbook,
    meta,
    'Affected Locations',
    [
      { header: 'Grouped by', key: 'group', width: 18 },
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Reports', key: 'count', width: 12 },
    ],
    locationRows,
    { barKey: 'count' }
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
    meta,
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
    meta,
    'Recurring Incidents',
    [
      { header: 'Category', key: 'label', width: 42 },
      { header: 'Barangay', key: 'barangay', width: 24 },
      { header: 'Municipality', key: 'municipality', width: 24 },
      { header: 'Reports', key: 'count', width: 12 },
    ],
    data.recurring,
    { barKey: 'count' }
  )

  addTable(
    workbook,
    meta,
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
    })),
    { barKey: 'jobs' }
  )

  // One row per report, so every number above can be checked or pivoted
  const priorityLabel = Object.fromEntries(data.byPriority.map((p) => [p.key, p.label]))
  addTable(
    workbook,
    meta,
    'Tickets',
    [
      { header: 'Ticket no.', key: 'ticket', width: 22 },
      { header: 'Filed', key: 'date', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
      { header: 'Category', key: 'category', width: 36 },
      { header: 'Barangay', key: 'barangay', width: 22 },
      { header: 'Municipality', key: 'municipality', width: 22 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Priority', key: 'priority', width: 14 },
      { header: 'In Master Ticket', key: 'master', width: 16 },
      { header: 'Reopened', key: 'reopened', width: 12 },
    ],
    data.tickets.map((t) => ({
      ticket: t.ticket,
      date: new Date(t.date),
      category: t.category,
      barangay: t.barangay || '—',
      municipality: t.municipality || '—',
      status: statusName(t.status),
      priority: t.priority ? priorityLabel[t.priority] || humanize(t.priority) : 'Not set',
      master: t.inMasterTicket ? 'Yes' : 'No',
      reopened: t.reopened ? 'Yes' : 'No',
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