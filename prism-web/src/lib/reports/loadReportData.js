// Loads and summarizes everything the Reports page needs.
// Read-only. Reuses the same rules as the dashboard (ticket = report or Master
// Ticket, response = ticket start to FIRST dispatch, repair = FIRST dispatch to
// final completion) so the figures match. No new database objects.

import { averageStages } from '@/lib/stageTimes'
import { fetchAll, buildReportQuery, buildAssignmentQuery } from '@/lib/reports/reportQueries'
import { previousPeriod, buildTrend } from '@/lib/reports/periods'
import { buildFindings } from '@/lib/reports/buildFindings'
import { loadLinemen } from '@/lib/reports/loadLinemen'
import {
  average,
  makeAreaLookup,
  filterByArea,
  buildTicketIndex,
  groupAssignmentsByTicket,
  computeTimes,
  percentWithin,
  reopenedTicketKeys,
  buildLocations,
  buildIssues,
  buildRecurring,
  buildPriorityBreakdown,
  buildStatusBreakdown,
  buildConsolidation,
  buildTicketRows,
} from '@/lib/reports/summarize'

// Still exported from here so existing imports keep working
export { loadFilterOptions } from '@/lib/reports/loadFilterOptions'

// change = current - previous. pct is null when there is no usable previous value.
function delta(current, previous) {
  if (current == null || previous == null) return { current, previous, change: null, pct: null }
  const change = current - previous
  const pct = previous === 0 ? null : Math.max(-100, Math.min(100, Math.round((change / previous) * 100)))
  return { current, previous, change, pct }
}

// filters = { from: 'YYYY-MM-DD' | null, to: 'YYYY-MM-DD' | null,
//             municipality, barangay ('name|municipality'), feeder, areaOffice,
//             category (issue code | 'uncategorized'), priority (key | 'none'), status,
//             compare (false skips the previous-period load) }
// Each location filter is 'all' or a value.
export async function loadReportData(supabase, coopId, filters) {
  const fromDate = filters.from ? new Date(`${filters.from}T00:00:00`) : null
  const toDate = filters.to ? new Date(`${filters.to}T23:59:59.999`) : null
  const fromIso = fromDate ? fromDate.toISOString() : null
  const toIso = toDate ? toDate.toISOString() : null

  // ---- Reports in the period (paged) ----
  const makeReportQuery = () => buildReportQuery(supabase, coopId, filters, fromIso, toIso)

  const [reportRes, settingsRes, areaRes, priorityRes] = await Promise.all([
    fetchAll(makeReportQuery),
    supabase
      .from('cooperative_settings')
      .select('response_time_threshold_minutes, resolution_target_minutes')
      .eq('cooperative_id', coopId)
      .maybeSingle(),
    supabase
      .from('service_areas')
      .select('barangay, municipality, feeder, substation, area_office')
      .eq('cooperative_id', coopId)
      .is('archived_at', null),
    supabase.rpc('get_priority_levels'),
  ])

  const thresholdMinutes = settingsRes.data?.response_time_threshold_minutes ?? null
  const targetMinutes = settingsRes.data?.resolution_target_minutes ?? null

  const areaOf = makeAreaLookup(areaRes.data)

  // Feeder and area office come from Service Areas, so they filter here
  const reports = filterByArea(reportRes.rows, filters, areaOf)

  const totalReports = reports.length
  const declinedReports = reports.filter((r) => r.status === 'cancelled').length
  const resolvedReports = reports.filter((r) => r.status === 'resolved').length
  const unresolvedReports = reports.filter(
    (r) => r.status !== 'resolved' && r.status !== 'cancelled'
  ).length

  // ---- Tickets (a Master Ticket starts at its earliest report) ----
  const { reportKeyById, ticketStart } = buildTicketIndex(reports)

  // ---- Assignments dispatched on or after the period start (paged) ----
  const assignmentRes = await fetchAll(() => buildAssignmentQuery(supabase, fromIso))

  const assignmentsByTicket = groupAssignmentsByTicket(assignmentRes.rows, reportKeyById, ticketStart)

  // ---- Response and resolution times ----
  const { responseTimes, repairTimes, resolutionTimes, reopenSources, stageRows } = computeTimes(
    assignmentsByTicket,
    ticketStart
  )

  const reopenedKeys = reopenedTicketKeys(reports, reportKeyById)

  const stageAverages = averageStages(stageRows)
  stageAverages.waiting = average(responseTimes)

  // ---- Breakdowns by location (counted per report) ----
  const locations = buildLocations(reports, areaOf)

  // ---- Issue categories ----
  const issues = buildIssues(reports)

  // ---- Recurring incidents: same rule, counted inside the selected period ----
  const recurring = buildRecurring(reports)

  // ---- Trend ----
  const times = reports.map((r) => new Date(r.created_at).getTime())
  const startMs = fromDate ? fromDate.getTime() : times.length ? Math.min(...times) : Date.now()
  const endMs = toDate ? Math.min(toDate.getTime(), Date.now()) : Date.now()
  const { trend, trendUnit } = buildTrend(reports, startMs, Math.max(endMs, startMs))

  // ---- Lineman performance (only jobs on the filtered tickets) ----
  const linemen = await loadLinemen(supabase, coopId, assignmentsByTicket)

  // ---- Priority and status breakdowns (counted per report) ----
  const byPriority = buildPriorityBreakdown(reports, priorityRes.data)
  const byStatus = buildStatusBreakdown(reports)

  // ---- Consolidation: reports merged into Master Tickets vs dispatches needed ----
  const consolidation = buildConsolidation(reports)

  // ---- One row per report, for the Tickets sheet ----
  const tickets = buildTicketRows(reports)

  const result = {
    summary: {
      totalReports,
      declinedReports,
      resolvedReports,
      unresolvedReports,
      reopenedCount: reopenedKeys.size,
      reopenSources,
      avgResponse: average(responseTimes),
      avgRepair: average(repairTimes),
      avgResolution: average(resolutionTimes),
      responsePct: percentWithin(responseTimes, thresholdMinutes),
      resolutionPct: percentWithin(resolutionTimes, targetMinutes),
      resolutionCount: resolutionTimes.length,
      thresholdMinutes,
      targetMinutes,
    },
    trend,
    trendUnit,
    issues,
    locations,
    recurring,
    stageAverages,
    linemen,
    truncated: reportRes.truncated || assignmentRes.truncated,
    byPriority,
    byStatus,
    consolidation,
    tickets,
    comparison: null,
    findings: [],
  }

  // ---- Previous period (skipped for "All time" and when this IS the previous load) ----
  const prev = filters._isPrevious || filters.compare === false ? null : previousPeriod(fromDate, toDate)
  if (prev) {
    try {
      const before = await loadReportData(supabase, coopId, { ...filters, ...prev, _isPrevious: true })
      const a = result.summary
      const b = before.summary
      result.comparison = {
        from: prev.from,
        to: prev.to,
        previous: b,
        deltas: {
          totalReports: delta(a.totalReports, b.totalReports),
          resolvedReports: delta(a.resolvedReports, b.resolvedReports),
          avgResponse: delta(a.avgResponse, b.avgResponse),
          avgResolution: delta(a.avgResolution, b.avgResolution),
          reopenedCount: delta(a.reopenedCount, b.reopenedCount),
        },
      }
    } catch {
      result.comparison = null // a failed comparison must never block the report
    }
  }

  if (!filters._isPrevious) result.findings = buildFindings(result, result.comparison)
  return result
}