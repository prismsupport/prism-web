// Loads and summarizes everything the Reports page needs.
// Read-only. Reuses the same rules as the dashboard (ticket = report or Master
// Ticket, response = ticket start to FIRST dispatch, repair = FIRST dispatch to
// final completion) so the figures match. No new database objects.

import { computeStageTimes, averageStages, STAGES, slowestStageKey, formatDuration } from '@/lib/stageTimes'
import { summarizeRatings, formatMinutes } from '@/lib/performance'
import { issueLabel } from '@/lib/issueCodes'
import { buildRecurringGroups } from '@/lib/recurring'

const PAGE = 1000 // Supabase returns at most 1000 rows per request
const MAX_PAGES = 20 // safety cap: 20,000 rows per query
const DAY = 86400000

function average(values) {
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null
}

function normKey(value) {
  return String(value || '').trim().toLowerCase()
}

function sortedEntries(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

// Runs a query page by page so long date ranges are not cut off at 1000 rows.
async function fetchAll(makeQuery) {
  const rows = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE
    const { data, error } = await makeQuery().range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data || []))
    if (!data || data.length < PAGE) return { rows, truncated: false }
  }
  return { rows, truncated: true }
}

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Daily buckets up to 31 days, weekly up to 180 days, monthly beyond that.
function buildTrend(reports, startMs, endMs) {
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


function humanize(code) {
  return String(code || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function toDateInput(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// The period right before the selected one, with the same number of days.
// Returns null for "All time" (no start date, so nothing comes before it).
function previousPeriod(fromDate, toDate) {
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

// change = current - previous. pct is null when there is no usable previous value.
function delta(current, previous) {
  if (current == null || previous == null) return { current, previous, change: null, pct: null }
  const change = current - previous
  const pct = previous === 0 ? null : Math.max(-100, Math.min(100, Math.round((change / previous) * 100)))
  return { current, previous, change, pct }
}

function signed(pct) {
  return `${pct > 0 ? '+' : ''}${pct}%`
}

// Plain sentences built from the numbers. Rule-based, no AI.
function buildFindings(data, comparison) {
  const s = data.summary
  const out = []
  if (s.totalReports === 0) return ['No outage reports match this selection.']

  const topIssue = data.issues[0]
  if (topIssue) {
    out.push(`Most common issue: ${topIssue[0]} (${topIssue[1]} of ${s.totalReports} reports).`)
  }
  const topBarangay = data.locations.barangay[0]
  if (topBarangay) out.push(`Most affected barangay: ${topBarangay[0]} (${topBarangay[1]} reports).`)
  const topFeeder = data.locations.feeder.find(([name]) => name !== 'Unmapped')
  if (topFeeder) out.push(`Most affected feeder: ${topFeeder[0]} (${topFeeder[1]} reports).`)

  if (s.responsePct != null && s.thresholdMinutes) {
    out.push(`${s.responsePct}% of tickets were dispatched within the ${s.thresholdMinutes}-minute response limit.`)
  }
  if (s.resolutionPct != null && s.targetMinutes) {
    out.push(`${s.resolutionPct}% of resolved tickets met the ${formatMinutes(s.targetMinutes)} resolution target.`)
  }

  const slowest = slowestStageKey(data.stageAverages)
  if (slowest) {
    const stage = STAGES.find((st) => st.key === slowest)
    out.push(`Slowest stage: ${stage.label}, averaging ${formatDuration(data.stageAverages[slowest])}.`)
  }
  if (data.recurring.length > 0) {
    const g = data.recurring[0]
    out.push(`${data.recurring.length} recurring incident group(s); the largest is ${g.label} in ${g.barangay} (${g.count} reports).`)
  }
  if (data.consolidation.dispatchesAvoided > 0) {
    out.push(`Master Tickets avoided ${data.consolidation.dispatchesAvoided} duplicate dispatch(es).`)
  }
  if (comparison?.deltas.totalReports.pct != null) {
    out.push(`Reports are ${signed(comparison.deltas.totalReports.pct)} compared with the previous period.`)
  }
  return out
}

// Options for the location filters, from the cooperative's Service Areas.
export async function loadFilterOptions(supabase, coopId) {
  const { data } = await supabase
    .from('service_areas')
    .select('barangay, municipality, feeder, area_office')
    .eq('cooperative_id', coopId)
    .is('archived_at', null)

  const rows = data || []
  const unique = (list) => Array.from(new Set(list.filter(Boolean))).sort()

  const barangayMap = new Map()
  rows.forEach((a) => {
    if (a.barangay && a.municipality) {
      barangayMap.set(`${a.barangay}|${a.municipality}`, `${a.barangay} (${a.municipality})`)
    }
  })

  return {
    municipalities: unique(rows.map((a) => a.municipality)),
    barangays: Array.from(barangayMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    feeders: unique(rows.map((a) => a.feeder)),
    areaOffices: unique(rows.map((a) => a.area_office)),
  }
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
  const makeReportQuery = () => {
    let q = supabase
      .from('reports')
      .select('report_id, ticket_number, status, priority, barangay, municipality, created_at, master_id, reopened_at, issue_code')
      .eq('cooperative_id', coopId)
      .order('created_at', { ascending: false })
      .order('report_id', { ascending: true })
    if (fromIso) q = q.gte('created_at', fromIso)
    if (toIso) q = q.lte('created_at', toIso)
    if (filters.municipality && filters.municipality !== 'all') {
      q = q.eq('municipality', filters.municipality)
    }
    if (filters.barangay && filters.barangay !== 'all') {
      const [b, m] = filters.barangay.split('|')
      q = q.eq('barangay', b).eq('municipality', m)
    }
    if (filters.category && filters.category !== 'all') {
      q = filters.category === 'uncategorized' ? q.is('issue_code', null) : q.eq('issue_code', filters.category)
    }
    if (filters.priority && filters.priority !== 'all') {
      q = filters.priority === 'none' ? q.is('priority', null) : q.eq('priority', filters.priority)
    }
    if (filters.status && filters.status !== 'all') {
      q = q.eq('status', filters.status)
    }
    return q
  }

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

  const areaLookup = {}
  ;(areaRes.data || []).forEach((a) => {
    const key = `${normKey(a.barangay)}|${normKey(a.municipality)}`
    if (!areaLookup[key]) areaLookup[key] = a
  })
  const areaOf = (r) => areaLookup[`${normKey(r.barangay)}|${normKey(r.municipality)}`]

  // Feeder and area office come from Service Areas, so they filter here
  let reports = reportRes.rows
  if (filters.feeder && filters.feeder !== 'all') {
    reports = reports.filter((r) => areaOf(r)?.feeder === filters.feeder)
  }
  if (filters.areaOffice && filters.areaOffice !== 'all') {
    reports = reports.filter((r) => areaOf(r)?.area_office === filters.areaOffice)
  }

  const totalReports = reports.length
  const declinedReports = reports.filter((r) => r.status === 'cancelled').length
  const resolvedReports = reports.filter((r) => r.status === 'resolved').length
  const unresolvedReports = reports.filter(
    (r) => r.status !== 'resolved' && r.status !== 'cancelled'
  ).length

  // ---- Tickets (a Master Ticket starts at its earliest report) ----
  const reportKeyById = {}
  const ticketStart = {}
  reports.forEach((r) => {
    const key = r.master_id ? `m:${r.master_id}` : `r:${r.report_id}`
    reportKeyById[r.report_id] = key
    const t = new Date(r.created_at).getTime()
    if (ticketStart[key] === undefined || t < ticketStart[key]) ticketStart[key] = t
  })

  // ---- Assignments dispatched on or after the period start (paged) ----
  // No upper limit: a ticket filed late in the period may be dispatched after it.
  const makeAssignmentQuery = () => {
    let q = supabase
      .from('job_assignments')
      .select(
        'assignment_id, report_id, master_id, lineman_id, status, assigned_at, completed_at, reopen_source, job_assignment_status_logs(new_status, changed_at)'
      )
      .order('assigned_at', { ascending: false })
      .order('assignment_id', { ascending: true })
    if (fromIso) q = q.gte('assigned_at', fromIso)
    return q
  }
  const assignmentRes = await fetchAll(makeAssignmentQuery)

  const assignmentsByTicket = {}
  assignmentRes.rows.forEach((a) => {
    const key = a.master_id ? `m:${a.master_id}` : reportKeyById[a.report_id]
    if (!key || ticketStart[key] === undefined) return
    ;(assignmentsByTicket[key] = assignmentsByTicket[key] || []).push(a)
  })

  // ---- Response and resolution times ----
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

  const percentWithin = (values, limit) =>
    limit && values.length > 0
      ? Math.round((values.filter((v) => v <= limit).length / values.length) * 100)
      : null

  const reopenedKeys = new Set()
  reports.forEach((r) => {
    if (r.reopened_at) reopenedKeys.add(reportKeyById[r.report_id])
  })

  const stageAverages = averageStages(stageRows)
  stageAverages.waiting = average(responseTimes)

  // ---- Breakdowns by location (counted per report) ----
  const maps = { barangay: {}, municipality: {}, feeder: {}, substation: {}, area_office: {} }
  const bump = (map, name) => {
    map[name] = (map[name] || 0) + 1
  }
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

  // ---- Issue categories ----
  const issueMap = {}
  reports.forEach((r) => bump(issueMap, issueLabel(r.issue_code)))
  const issues = sortedEntries(issueMap)

  // ---- Recurring incidents: same rule, counted inside the selected period ----
  const recurring = buildRecurringGroups(reports.filter((r) => r.status !== 'cancelled')).groups.map(
    (g) => ({
      label: g.label,
      barangay: g.barangay,
      municipality: g.municipality,
      count: g.count,
    })
  )

  // ---- Trend ----
  const times = reports.map((r) => new Date(r.created_at).getTime())
  const startMs = fromDate ? fromDate.getTime() : times.length ? Math.min(...times) : Date.now()
  const endMs = toDate ? Math.min(toDate.getTime(), Date.now()) : Date.now()
  const { trend, trendUnit } = buildTrend(reports, startMs, Math.max(endMs, startMs))

  // ---- Lineman performance (only jobs on the filtered tickets) ----
  const resolvedAssignments = []
  Object.values(assignmentsByTicket).forEach((list) => {
    list.forEach((a) => {
      if (a.status === 'resolved' && a.completed_at) resolvedAssignments.push(a)
    })
  })

  const { data: linemenUsers } = await supabase
    .from('users')
    .select('id, first_name, last_name, is_active')
    .eq('cooperative_id', coopId)
    .eq('user_type', 'lineman')
  const linemanIds = (linemenUsers || []).map((l) => l.id)

  let officeRows = []
  if (linemanIds.length > 0) {
    const { data } = await supabase
      .from('lineman')
      .select('profile_id, assigned_area_office')
      .in('profile_id', linemanIds)
    officeRows = data || []
  }

  let ratingRows = []
  const ratingChunks = await Promise.all(
    chunk(
      resolvedAssignments.map((a) => a.assignment_id),
      100
    ).map((ids) => supabase.from('job_ratings').select('assignment_id, lineman_id, rating').in('assignment_id', ids))
  )
  ratingChunks.forEach((res) => {
    ratingRows = ratingRows.concat(res.data || [])
  })

  const linemen = (linemenUsers || [])
    .map((l) => {
      const done = resolvedAssignments.filter((a) => a.lineman_id === l.id)
      const repair = done
        .map((a) => (new Date(a.completed_at) - new Date(a.assigned_at)) / 60000)
        .filter((m) => m >= 0)
      const stages = averageStages(done.map((a) => computeStageTimes(a, a.job_assignment_status_logs)))
      return {
        id: l.id,
        name: `${l.first_name} ${l.last_name}`,
        isActive: l.is_active,
        areaOffice: officeRows.find((o) => o.profile_id === l.id)?.assigned_area_office || null,
        jobsCompleted: done.length,
        avgRepair: average(repair),
        avgTravel: stages.travel,
        avgOnSite: stages.onSite,
        ...summarizeRatings(ratingRows.filter((r) => r.lineman_id === l.id)),
      }
    })
    .sort((a, b) => b.jobsCompleted - a.jobsCompleted)

  // ---- Priority and status breakdowns (counted per report) ----
  const priorityLevels = Array.isArray(priorityRes.data) ? priorityRes.data : []
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

  const statusCounts = {}
  reports.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
  })
  const byStatus = ['pending', 'dispatched', 'in_progress', 'qa_review', 'resolved', 'cancelled'].map((key) => ({
    key,
    count: statusCounts[key] || 0,
  }))

  // ---- Consolidation: reports merged into Master Tickets vs dispatches needed ----
  const mergedReports = reports.filter((r) => r.master_id).length
  const masterTickets = new Set(reports.filter((r) => r.master_id).map((r) => r.master_id)).size
  const consolidation = {
    mergedReports,
    masterTickets,
    dispatchesAvoided: Math.max(0, mergedReports - masterTickets),
  }

  // ---- One row per report, for the Tickets sheet ----
  const tickets = reports.map((r) => ({
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