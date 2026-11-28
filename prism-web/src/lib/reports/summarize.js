// Pure steps of the report: no database calls. Each one takes data that
// loadReportData has already fetched and returns one piece of the result.

import { computeStageTimes } from '@/lib/stageTimes'
import { issueLabel } from '@/lib/issueCodes'
import { buildRecurringGroups } from '@/lib/recurring'

export function average(values) {
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null
}

export function normKey(value) {
  return String(value || '').trim().toLowerCase()
}

function sortedEntries(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

function humanize(code) {
  return String(code || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const bump = (map, name) => {
  map[name] = (map[name] || 0) + 1
}

// Returns areaOf(report) -> its Service Area row (feeder, substation, area office) or undefined
export function makeAreaLookup(areaRows) {
  const areaLookup = {}
  ;(areaRows || []).forEach((a) => {
    const key = `${normKey(a.barangay)}|${normKey(a.municipality)}`
    if (!areaLookup[key]) areaLookup[key] = a
  })
  return (r) => areaLookup[`${normKey(r.barangay)}|${normKey(r.municipality)}`]
}

// Feeder and area office come from Service Areas, so they filter here
export function filterByArea(reports, filters, areaOf) {
  let result = reports
  if (filters.feeder && filters.feeder !== 'all') {
    result = result.filter((r) => areaOf(r)?.feeder === filters.feeder)
  }
  if (filters.areaOffice && filters.areaOffice !== 'all') {
    result = result.filter((r) => areaOf(r)?.area_office === filters.areaOffice)
  }
  return result
}

// ---- Tickets (a Master Ticket starts at its earliest report) ----
export function buildTicketIndex(reports) {
  const reportKeyById = {}
  const ticketStart = {}
  reports.forEach((r) => {
    const key = r.master_id ? `m:${r.master_id}` : `r:${r.report_id}`
    reportKeyById[r.report_id] = key
    const t = new Date(r.created_at).getTime()
    if (ticketStart[key] === undefined || t < ticketStart[key]) ticketStart[key] = t
  })
  return { reportKeyById, ticketStart }
}

export function groupAssignmentsByTicket(assignmentRows, reportKeyById, ticketStart) {
  const assignmentsByTicket = {}
  assignmentRows.forEach((a) => {
    const key = a.master_id ? `m:${a.master_id}` : reportKeyById[a.report_id]
    if (!key || ticketStart[key] === undefined) return
    ;(assignmentsByTicket[key] = assignmentsByTicket[key] || []).push(a)
  })
  return assignmentsByTicket
}

// ---- Response and resolution times ----
export function computeTimes(assignmentsByTicket, ticketStart) {
  const responseTimes = []
  const repairTimes = []
  const resolutionTimes = []
  const reopenSources = {}
  const stageRows = []

  Object.entries(assignmentsByTicket).forEach(([key, list]) => {
    const firstAssigned = Math.min(...list.map((a) => new Date(a.assigned_at).getTime()))
    const response = (firstAssigned - ticketStart[key]) / 60000
    if (response >= 0) responseTimes.push(response)

    const finished = list.filter((a) => a.status === 'resolved' && a.completed_at)
    if (finished.length > 0) {
      const lastCompleted = Math.max(...finished.map((a) => new Date(a.completed_at).getTime()))
      const repair = (lastCompleted - firstAssigned) / 60000
      if (repair >= 0) repairTimes.push(repair)
      const resolution = (lastCompleted - ticketStart[key]) / 60000
      if (resolution >= 0) resolutionTimes.push(resolution)
    }

    list.forEach((a) => {
      if (a.reopen_source) reopenSources[a.reopen_source] = (reopenSources[a.reopen_source] || 0) + 1
      stageRows.push(computeStageTimes(a, a.job_assignment_status_logs))
    })
  })

  return { responseTimes, repairTimes, resolutionTimes, reopenSources, stageRows }
}

export function percentWithin(values, limit) {
  return limit && values.length > 0
    ? Math.round((values.filter((v) => v <= limit).length / values.length) * 100)
    : null
}

// Set of ticket keys (a Master Ticket counts once) that were reopened
export function reopenedTicketKeys(reports, reportKeyById) {
  const reopenedKeys = new Set()
  reports.forEach((r) => {
    if (r.reopened_at) reopenedKeys.add(reportKeyById[r.report_id])
  })
  return reopenedKeys
}

// ---- Breakdowns by location (counted per report) ----
export function buildLocations(reports, areaOf) {
  const maps = { barangay: {}, municipality: {}, feeder: {}, substation: {}, area_office: {} }
  reports.forEach((r) => {
    if (r.barangay) bump(maps.barangay, r.municipality ? `${r.barangay} (${r.municipality})` : r.barangay)
    if (r.municipality) bump(maps.municipality, r.municipality)
    const area = areaOf(r)
    bump(maps.feeder, area?.feeder || 'Unmapped')
    bump(maps.substation, area?.substation || 'Unmapped')
    bump(maps.area_office, area?.area_office || 'Unmapped')
  })
  const locations = {}
  Object.keys(maps).forEach((k) => {
    locations[k] = sortedEntries(maps[k])
  })
  return locations
}

// ---- Issue categories ----
export function buildIssues(reports) {
  const issueMap = {}
  reports.forEach((r) => bump(issueMap, issueLabel(r.issue_code)))
  return sortedEntries(issueMap)
}

// ---- Recurring incidents: same rule, counted inside the selected period ----
export function buildRecurring(reports) {
  return buildRecurringGroups(reports.filter((r) => r.status !== 'cancelled')).groups.map(
    (g) => ({
      label: g.label,
      barangay: g.barangay,
      municipality: g.municipality,
      count: g.count,
    })
  )
}

// ---- Priority breakdown (counted per report) ----
// priorityData = the result of the get_priority_levels RPC
export function buildPriorityBreakdown(reports, priorityData) {
  const priorityLevels = Array.isArray(priorityData) ? priorityData : []
  const priorityCounts = {}
  reports.forEach((r) => {
    const k = r.priority || '__none'
    priorityCounts[k] = (priorityCounts[k] || 0) + 1
  })
  const byPriority = []
  priorityLevels
    .slice()
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .forEach((l) => {
      if (priorityCounts[l.key]) byPriority.push({ key: l.key, label: l.label, count: priorityCounts[l.key] })
      delete priorityCounts[l.key]
    })
  Object.entries(priorityCounts).forEach(([k, count]) => {
    byPriority.push({ key: k, label: k === '__none' ? 'Not set' : humanize(k), count })
  })
  return byPriority
}

// ---- Status breakdown (counted per report) ----
export function buildStatusBreakdown(reports) {
  const statusCounts = {}
  reports.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
  })
  return ['pending', 'dispatched', 'in_progress', 'qa_review', 'resolved', 'cancelled'].map((key) => ({
    key,
    count: statusCounts[key] || 0,
  }))
}

// ---- Consolidation: reports merged into Master Tickets vs dispatches needed ----
export function buildConsolidation(reports) {
  const mergedReports = reports.filter((r) => r.master_id).length
  const masterTickets = new Set(reports.filter((r) => r.master_id).map((r) => r.master_id)).size
  return {
    mergedReports,
    masterTickets,
    dispatchesAvoided: Math.max(0, mergedReports - masterTickets),
  }
}

// ---- One row per report, for the Tickets sheet ----
export function buildTicketRows(reports) {
  return reports.map((r) => ({
    ticket: r.ticket_number,
    date: r.created_at,
    category: issueLabel(r.issue_code),
    barangay: r.barangay || null,
    municipality: r.municipality || null,
    status: r.status,
    priority: r.priority || null,
    inMasterTicket: !!r.master_id,
    reopened: !!r.reopened_at,
  }))
}