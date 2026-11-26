import { summarizeRatings } from '@/lib/performance'
import { issueLabel } from '@/lib/issueCodes'
import { loadRecentIssueReports, buildRecurringGroups } from '@/lib/recurring'
import { computeStageTimes, averageStages } from '@/lib/stageTimes'
import { MAX_ROWS, STATUS_CARDS } from '@/lib/dashboard/constants'
import { average, normKey, sortedEntries, buildTrend } from '@/lib/dashboard/helpers'

// ---------------------------------------------------------------------------
// Data loading. Each section only runs when the supervisor has that feature.
// ---------------------------------------------------------------------------

export async function loadDispatchData(supabase, coopId, sinceIso, rangeDays) {
  // ---- Reports in the selected period ----
  let reportQuery = supabase
    .from('reports')
    .select('report_id, status, barangay, municipality, created_at, master_id, reopened_at, issue_code')
    .eq('cooperative_id', coopId)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS)
  if (sinceIso) reportQuery = reportQuery.gte('created_at', sinceIso)

  const { data: reportsData, error: reportsError } = await reportQuery
  if (reportsError) throw new Error(reportsError.message)
  const reports = reportsData || []

  // Cooperative targets and service areas (feeder, substation, area office)
  const [{ data: settingsRow }, { data: areaRows }] = await Promise.all([
    supabase
      .from('cooperative_settings')
      .select('response_time_threshold_minutes, resolution_target_minutes')
      .eq('cooperative_id', coopId)
      .maybeSingle(),
    supabase
      .from('service_areas')
      .select('barangay, municipality, feeder, substation, area_office')
      .eq('cooperative_id', coopId),
  ])
  const thresholdMinutes = settingsRow?.response_time_threshold_minutes ?? null
  const targetMinutes = settingsRow?.resolution_target_minutes ?? null

  const totalReports = reports.length
  const declinedReports = reports.filter((r) => r.status === 'cancelled').length
  const resolvedReports = reports.filter((r) => r.status === 'resolved').length

  // ---- Group reports into tickets ----
  // A ticket is either a standalone report or a Master Ticket. A merged
  // outage starts the clock at its earliest report.
  const reportKeyById = {}
  const ticketStart = {}
  reports.forEach((r) => {
    const key = r.master_id ? `m:${r.master_id}` : `r:${r.report_id}`
    reportKeyById[r.report_id] = key
    const t = new Date(r.created_at).getTime()
    if (ticketStart[key] === undefined || t < ticketStart[key]) ticketStart[key] = t
  })

  // ---- Assignments dispatched in the same period ----
  // Every assignment of a ticket created in the period happens after the
  // ticket was created, so this date filter catches all of them. Assignments
  // of older tickets are ignored below.
  let assignmentQuery = supabase
    .from('job_assignments')
    .select('assignment_id, report_id, master_id, status, assigned_at, completed_at, reopen_source, job_assignment_status_logs(new_status, changed_at)')
    .order('assigned_at', { ascending: false })
    .limit(MAX_ROWS)
  if (sinceIso) assignmentQuery = assignmentQuery.gte('assigned_at', sinceIso)

  const { data: assignmentData } = await assignmentQuery
  const assignments = assignmentData || []

  const assignmentsByTicket = {}
  assignments.forEach((a) => {
    const key = a.master_id ? `m:${a.master_id}` : reportKeyById[a.report_id]
    if (!key || ticketStart[key] === undefined) return
    ;(assignmentsByTicket[key] = assignmentsByTicket[key] || []).push(a)
  })

  // Response time: ticket start -> FIRST dispatch.
  // Repair time: FIRST dispatch -> final completion (resolved tickets only).
  const responseTimes = []
  const repairTimes = []
  const resolutionTimes = []
  const reopenSources = {}
  Object.entries(assignmentsByTicket).forEach(([key, list]) => {
    const firstAssigned = Math.min(...list.map((a) => new Date(a.assigned_at).getTime()))
    const response = (firstAssigned - ticketStart[key]) / 60000
    if (response >= 0) responseTimes.push(response)

    const finished = list.filter((a) => a.status === 'resolved' && a.completed_at)
    if (finished.length > 0) {
      const lastCompleted = Math.max(...finished.map((a) => new Date(a.completed_at).getTime()))
      const repair = (lastCompleted - firstAssigned) / 60000
      if (repair >= 0) repairTimes.push(repair)

      // Resolution time: ticket start -> final completion
      const resolution = (lastCompleted - ticketStart[key]) / 60000
      if (resolution >= 0) resolutionTimes.push(resolution)
    }

    list.forEach((a) => {
      if (a.reopen_source) reopenSources[a.reopen_source] = (reopenSources[a.reopen_source] || 0) + 1
    })
  })

  const percentWithin = (values, limit) =>
    limit && values.length > 0
      ? Math.round((values.filter((v) => v <= limit).length / values.length) * 100)
      : null
  const responsePct = percentWithin(responseTimes, thresholdMinutes)
  const resolutionPct = percentWithin(resolutionTimes, targetMinutes)

  // Reopened tickets (a Master Ticket counts once)
  const reopenedKeys = new Set()
  reports.forEach((r) => {
    if (r.reopened_at) reopenedKeys.add(reportKeyById[r.report_id])
  })

  // Average time per stage. Waiting for dispatch reuses the response times above.
  const stageRows = []
  Object.values(assignmentsByTicket).forEach((list) => {
    list.forEach((a) => {
      stageRows.push(computeStageTimes(a, a.job_assignment_status_logs))
    })
  })
  const stageAverages = averageStages(stageRows)
  stageAverages.waiting = average(responseTimes)

  // ---- Breakdowns by area (reports, not tickets) ----
  const areaLookup = {}
  ;(areaRows || []).forEach((a) => {
    const key = `${normKey(a.barangay)}|${normKey(a.municipality)}`
    if (!areaLookup[key]) areaLookup[key] = a
  })
  const maps = { barangay: {}, municipality: {}, feeder: {}, substation: {}, area_office: {} }
  const bump = (map, name) => {
    map[name] = (map[name] || 0) + 1
  }
  reports.forEach((r) => {
    if (r.barangay) {
      bump(maps.barangay, r.municipality ? `${r.barangay} (${r.municipality})` : r.barangay)
    }
    if (r.municipality) bump(maps.municipality, r.municipality)
    const area = areaLookup[`${normKey(r.barangay)}|${normKey(r.municipality)}`]
    bump(maps.feeder, area?.feeder || 'Unmapped')
    bump(maps.substation, area?.substation || 'Unmapped')
    bump(maps.area_office, area?.area_office || 'Unmapped')
  })
  const areaBreakdown = {}
  Object.keys(maps).forEach((k) => {
    areaBreakdown[k] = sortedEntries(maps[k])
  })

  // ---- Most common issues ----
  const issueMap = {}
  reports.forEach((r) => bump(issueMap, issueLabel(r.issue_code)))
  const issueData = sortedEntries(issueMap)
  const recentIssueRows = await loadRecentIssueReports(supabase, coopId)
  const recurringRows = buildRecurringGroups(recentIssueRows).groups.map((g) => [
    `${g.label} · ${g.barangay}${g.municipality ? ` (${g.municipality})` : ''}`,
    g.count,
  ])

  // ---- Report trend ----
  const trend = buildTrend(reports, rangeDays)

  // ---- Current status overview (not time-limited) ----
  // Count-only queries: nothing is downloaded, only the totals come back.
  const countResults = await Promise.all(
    STATUS_CARDS.flatMap((s) => [
      supabase
        .from('reports')
        .select('report_id', { count: 'exact', head: true })
        .eq('cooperative_id', coopId)
        .is('master_id', null)
        .eq('status', s.key),
      supabase
        .from('master_tickets')
        .select('master_id', { count: 'exact', head: true })
        .eq('cooperative_id', coopId)
        .eq('status', s.key),
    ])
  )
  const statusCounts = {}
  STATUS_CARDS.forEach((s, i) => {
    statusCounts[s.key] = (countResults[i * 2].count ?? 0) + (countResults[i * 2 + 1].count ?? 0)
  })

  // ---- Top lineman performance (selected period) ----
  const { data: linemenUsers } = await supabase
    .from('users')
    .select('id, first_name, last_name, is_active')
    .eq('cooperative_id', coopId)
    .eq('user_type', 'lineman')

  const linemanIds = (linemenUsers || []).map((l) => l.id)
  let completedAssignments = []
  if (linemanIds.length > 0) {
    let completedQuery = supabase
      .from('job_assignments')
      .select('lineman_id')
      .in('lineman_id', linemanIds)
      .eq('status', 'resolved')
    if (sinceIso) completedQuery = completedQuery.gte('completed_at', sinceIso)
    const { data } = await completedQuery
    completedAssignments = data || []
  }

  const performance = (linemenUsers || [])
    .map((l) => ({
      ...l,
      jobsCompleted: completedAssignments.filter((a) => a.lineman_id === l.id).length,
    }))
    .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
    .slice(0, 5)

  const topIds = performance.map((l) => l.id)
  let ratingRows = []
  if (topIds.length > 0) {
    let ratingQuery = supabase
      .from('job_ratings')
      .select('lineman_id, rating')
      .in('lineman_id', topIds)
    if (sinceIso) ratingQuery = ratingQuery.gte('created_at', sinceIso)
    const { data: ratingData } = await ratingQuery
    ratingRows = ratingData || []
  }

  const linemenPerformance = performance.map((l) => ({
    ...l,
    ...summarizeRatings(ratingRows.filter((r) => r.lineman_id === l.id)),
  }))

  return {
    stats: {
      totalReports,
      declinedReports,
      resolvedReports,
      avgResponse: average(responseTimes),
      avgRepair: average(repairTimes),
      avgResolution: average(resolutionTimes),
      responsePct,
      thresholdMinutes,
      resolutionPct,
      resolutionCount: resolutionTimes.length,
      targetMinutes,
      reopenedCount: reopenedKeys.size,
      reopenSources,
    },
    areaBreakdown,
    issueData,
    recurringRows,
    trend,
    statusCounts,
    linemenPerformance,
    stageAverages,
    truncated: reports.length >= MAX_ROWS || assignments.length >= MAX_ROWS,
  }
}

export async function loadAdvisorySummary(supabase, coopId) {
  const { data: advisories } = await supabase
    .from('advisories')
    .select('date, start_time, end_time')
    .eq('cooperative_id', coopId)
    .eq('category', 'power_interruption')
    .is('archived_at', null)

  const now = new Date()
  let upcoming = 0
  let active = 0
  let completed = 0
  ;(advisories || []).forEach((a) => {
    const start = new Date(`${a.date}T${a.start_time}`)
    const end = new Date(`${a.date}T${a.end_time}`)
    if (now < start) upcoming++
    else if (now >= start && now <= end) active++
    else completed++
  })

  return { all: (advisories || []).length, upcoming, active, completed }
}

export async function loadAttention(supabase, coopId, can) {
  const out = {}
  const tasks = []

  if (can.dispatch) {
    tasks.push(
      Promise.all([
        supabase
          .from('reopen_requests')
          .select('reopen_id, reports!inner(cooperative_id)', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('reports.cooperative_id', coopId),
        // Also notifies supervisors once per overdue ticket, same as the Dispatch page
        supabase.rpc('check_response_time_overdue', { p_cooperative_id: coopId }),
      ]).then(([reopenRes, overdueRes]) => {
        out.reopen = reopenRes.count ?? 0
        out.overdue = (overdueRes.data || []).length
      })
    )
  }

  if (can.faq) {
    tasks.push(
      supabase
        .from('faq_inquiries')
        .select('faq_inquiries_id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then((res) => {
          out.faq = res.count ?? 0
        })
    )
  }

  await Promise.all(tasks)
  return out
}