'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatMinutes, summarizeRatings } from '@/lib/performance'
import { usePermissions } from '@/lib/supervisor/PermissionsContext'
import { PageLoading } from "@/components/ui/Skeleton";
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import SegmentedControl from '@/components/ui/SegmentedControl'
import MetricCard from '@/components/dashboard/MetricCard'
import TrendChart from '@/components/dashboard/TrendChart'
import StatusBreakdown from '@/components/dashboard/StatusBreakdown'
import Avatar from '@/components/ui/Avatar'
import StatusPill from '@/components/ui/StatusPill'
import EmptyState from '@/components/ui/EmptyState'
import StageBreakdown from '@/components/dashboard/StageBreakdown'
import { computeStageTimes, averageStages } from '@/lib/stageTimes'
import AreaBreakdown from '@/components/dashboard/AreaBreakdown'
import BarList from '@/components/dashboard/BarList'
import { issueLabel } from '@/lib/issueCodes'
import { loadRecentIssueReports, buildRecurringGroups, RECURRING_MIN_REPORTS, RECURRING_WINDOW_DAYS } from '@/lib/recurring'

const MAX_ROWS = 1000 // Supabase returns at most 1000 rows per request

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'insights', label: 'Insights' },
  { key: 'performance', label: 'Performance' },
]

const RANGES = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
]

const STATUS_CARDS = [
  { key: 'pending', label: 'Pending', color: 'text-red-600' },
  { key: 'dispatched', label: 'Dispatched', color: 'text-amber-600' },
  { key: 'in_progress', label: 'In Progress', color: 'text-green-600' },
  { key: 'qa_review', label: 'QA Review', color: 'text-blue-700' },
  { key: 'resolved', label: 'Resolved', color: 'text-gray-900' },
]

function average(values) {
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null
}

function normKey(value) {
  return String(value || '').trim().toLowerCase()
}

function sortedEntries(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

function sourceLabel(source) {
  if (source === 'consumer') return 'reopened by consumer'
  if (source === 'supervisor') return 'reopened by supervisor'
  if (source === 'qa_rejection') return 'reopened after QA rejection'
  return `reopened from ${String(source).replace(/_/g, ' ')}`
}

// Report counts per bucket: daily for 7 days, 6-day periods for 30 and 90
// days, and the last 12 months for all time.
function buildTrend(reports, rangeDays) {
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

function trendSubtitle(rangeKey) {
  if (rangeKey === '7') return 'Reports per day, last 7 days'
  if (rangeKey === 'all') return 'Reports per month, last 12 months'
  return `Reports per 6-day period, last ${rangeKey} days`
}

function AttentionCard({ label, count, href, color }) {
  const active = count > 0
  return (
    <Link
      href={href}
      className={`bg-white rounded-xl border p-4 transition-colors ${
        active
          ? 'border-gray-300 hover:border-blue-600'
          : 'border-gray-200 opacity-70 hover:opacity-100'
      }`}
    >
      <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${active ? color : 'text-gray-300'}`}>{count}</p>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Data loading. Each section only runs when the supervisor has that feature.
// ---------------------------------------------------------------------------

async function loadDispatchData(supabase, coopId, sinceIso, rangeDays) {
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

async function loadAdvisorySummary(supabase, coopId) {
  const { data: advisories } = await supabase
    .from('advisories')
    .select('date, start_time, end_time')
    .eq('cooperative_id', coopId)
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

async function loadAttention(supabase, coopId, can) {
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

// ---------------------------------------------------------------------------

export default function SupervisorDashboardPage() {
  const { hasFeature } = usePermissions()
  const { statusLabel } = useStatusLabels()
  const can = {
    dispatch: hasFeature('dispatch'),
    advisories: hasFeature('advisories'),
    faq: hasFeature('faq'),
  }
  const hasAnyWidget = can.dispatch || can.advisories || can.faq

  const [rangeKey, setRangeKey] = useState('30')
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const latestLoad = useRef(0)

  const range = RANGES.find((r) => r.key === rangeKey)

  useEffect(() => {
    loadDashboard()
  }, [rangeKey])

  async function loadDashboard() {
    const loadId = ++latestLoad.current
    setRefreshing(true)
    setError('')
    try {
      const result = await fetchDashboardData()
      if (loadId !== latestLoad.current) return // a newer load is running
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      if (loadId !== latestLoad.current) return
      setError(err?.message || 'Unable to load the dashboard.')
    }
    setLoading(false)
    setRefreshing(false)
  }

  async function fetchDashboardData() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be signed in.')

    const { data: myRow } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()
    if (!myRow) throw new Error('Unable to load your cooperative.')
    const coopId = myRow.cooperative_id

    let sinceIso = null
    if (range.days) {
      const since = new Date()
      since.setDate(since.getDate() - range.days)
      sinceIso = since.toISOString()
    }

    const [dispatchPart, advisoryPart, attentionPart] = await Promise.all([
      can.dispatch ? loadDispatchData(supabase, coopId, sinceIso, range.days) : null,
      can.advisories ? loadAdvisorySummary(supabase, coopId) : null,
      loadAttention(supabase, coopId, can),
    ])

    return { ...dispatchPart, advisoryCounts: advisoryPart, attention: attentionPart }
  }

  if (loading) return <PageLoading />

  if (!data) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {error || 'Unable to load the dashboard.'}
      </p>
    )
  }

  const { stats, areaBreakdown, issueData, recurringRows, trend, statusCounts, linemenPerformance, advisoryCounts, attention, stageAverages } = data
  const unresolvedNow = statusCounts
    ? (statusCounts.pending ?? 0) + (statusCounts.dispatched ?? 0) + (statusCounts.in_progress ?? 0) + (statusCounts.qa_review ?? 0)
    : 0
  const reopenHint = stats
    ? Object.entries(stats.reopenSources).map(([src, n]) => `${n} ${sourceLabel(src)}`).join(' · ')
    : ''

  // Needs-attention cards: only the ones this supervisor can act on
  const attentionItems = []
  if (can.dispatch && statusCounts) {
    attentionItems.push(
      { key: 'pending', label: `${statusLabel('pending')} tickets`, count: statusCounts.pending, href: '/supervisor/dispatch?status=pending', color: 'text-red-600' },
      { key: 'overdue', label: 'Overdue tickets', count: attention.overdue ?? 0, href: '/supervisor/dispatch?status=overdue', color: 'text-red-600' },
      { key: 'qa', label: 'QA reviews waiting', count: statusCounts.qa_review, href: '/supervisor/dispatch?status=qa_review', color: 'text-blue-700' },
      { key: 'reopen', label: 'Reopen requests', count: attention.reopen ?? 0, href: '/supervisor/dispatch', color: 'text-amber-600' }
    )
  }
  if (can.faq) {
    attentionItems.push({ key: 'faq', label: 'Unanswered FAQs', count: attention.faq ?? 0, href: '/supervisor/faq', color: 'text-amber-600' })
  }
  const allClear = attentionItems.length > 0 && attentionItems.every((i) => i.count === 0)

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {can.dispatch
              ? `Outage reporting, dispatch, and repair performance: ${range.label.toLowerCase()}. Status, attention, and duty figures are always current.`
              : 'Your cooperative at a glance.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {can.dispatch && (
            <SegmentedControl
              options={RANGES}
              value={rangeKey}
              onChange={setRangeKey}
              disabled={refreshing}
            />
          )}
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated{' '}
              {lastUpdated.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={loadDashboard}
            disabled={refreshing}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {data.truncated && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          This period has more than {MAX_ROWS} records, so the figures below cover the most
          recent {MAX_ROWS}. Choose a shorter period for exact numbers.
        </p>
      )}

      {!hasAnyWidget && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            No dashboard widgets are available for your account yet.
          </p>
          <p className="text-sm text-gray-500">
            Ask your cooperative owner to assign features to your account.
          </p>
        </div>
      )}

      {/* Needs attention */}
      {attentionItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Needs Attention</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {attentionItems.map((item) => (
              <AttentionCard
                key={item.key}
                label={item.label}
                count={item.count}
                href={item.href}
                color={item.color}
              />
            ))}
          </div>
          {allClear && (
            <p className="text-xs text-gray-400 mt-2">Nothing needs your attention right now.</p>
          )}
        </div>
      )}

      {can.dispatch && stats && (
        <>
          <div className="mb-6">
            <SegmentedControl options={TABS} value={tab} onChange={setTab} />
          </div>

          {tab === 'overview' && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label="Total outage reports"
              value={stats.totalReports}
              hint={stats.declinedReports > 0 ? `${stats.declinedReports} declined` : undefined}
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect width="8" height="4" x="8" y="2" rx="1" />
            </MetricCard>
            <MetricCard tone="green" label="Reports resolved" value={stats.resolvedReports}>
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </MetricCard>
            <MetricCard
              tone="amber"
              label="Unresolved tickets"
              value={unresolvedNow}
              hint="Current: not yet resolved"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect width="8" height="4" x="8" y="2" rx="1" />
            </MetricCard>
            <MetricCard
              tone="green"
              label="Resolved within target"
              value={stats.resolutionPct !== null ? `${stats.resolutionPct}%` : '—'}
              hint={
                stats.targetMinutes
                  ? `Target ${formatMinutes(stats.targetMinutes)} · ${stats.resolutionCount} resolved`
                  : 'No resolution target set (Dispatch page)'
              }
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </MetricCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Dispatch Status Overview</h2>
              <p className="text-xs text-gray-400 mb-4">Current, all tickets</p>
              <StatusBreakdown cards={STATUS_CARDS} counts={statusCounts} />
            </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Report Trend</h2>
            <p className="text-xs text-gray-400 mb-4">{trendSubtitle(rangeKey)}</p>
            <TrendChart data={trend} />
                </div>
              </div>
            </>
          )}

          {tab === 'insights' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <AreaBreakdown breakdown={areaBreakdown} />

                {/* Most common issues */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-1 text-sm font-bold text-gray-900">Most Common Issues</h2>
                  <p className="mb-4 text-xs text-gray-400">
                    Category chosen by the consumer. Older reports show as Uncategorized.
                  </p>
                  <BarList
                    rows={issueData}
                    emptyTitle="No reports in this period"
                    emptyDescription="Issue categories appear as consumers submit reports."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-4">
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
                  <h2 className="mb-1 text-sm font-bold text-gray-900">Recurring Issues</h2>
                  <p className="mb-4 text-xs text-gray-400">
                    The same category reported {RECURRING_MIN_REPORTS} or more times in the same barangay in the
                    last {RECURRING_WINDOW_DAYS} days. This window is fixed and does not follow the period selector.
                  </p>
                  <BarList
                    rows={recurringRows}
                    emptyTitle="No recurring issues"
                    emptyDescription="Nothing has been reported often enough in one barangay to count as recurring."
                  />
                </div>

                <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Reopened tickets</p>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center py-4">
                    <p className="font-display text-4xl font-extrabold tabular-nums text-gray-900">
                      {stats.reopenedCount}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {reopenHint || 'Reports filed in this period'}
                    </p>
                  </div>
                  <p className="border-t border-gray-100 pt-4 text-xs text-gray-400">
                    Tickets reopened after being marked resolved.
                  </p>
                </div>
              </div>
            </>
          )}

          {tab === 'performance' && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              tone="amber"
              label="Avg. response time"
              value={formatMinutes(stats.avgResponse)}
              hint={
                stats.responsePct !== null
                  ? `${stats.responsePct}% dispatched within ${stats.thresholdMinutes} min`
                  : 'Submission to first dispatch'
              }
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </MetricCard>
            <MetricCard
              label="Avg. resolution time"
              value={formatMinutes(stats.avgResolution)}
              hint="Submission to final completion"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </MetricCard>
            <MetricCard
              label="Avg. repair time"
              value={formatMinutes(stats.avgRepair)}
              hint="First dispatch to completion"
            >
              <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
            </MetricCard>
              </div>

              <StageBreakdown averages={stageAverages} />

              <div className="mb-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">Top Lineman Performance</h2>
                <Link href="/supervisor/lineman-performance" className="text-xs font-semibold text-blue-700">
                  View all
                </Link>
              </div>
              {linemenPerformance.length === 0 ? (
                <EmptyState
                  title="No completed jobs in this period"
                  description="Linemen appear here once they complete jobs."
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {linemenPerformance.map((l, i) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-4 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                        <Avatar name={`${l.first_name} ${l.last_name}`} size={32} />
                        <span className="font-medium text-gray-900">
                          {l.first_name} {l.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">
                          <span className="font-display font-bold tabular-nums text-gray-900">
                            {l.jobsCompleted}
                          </span>{' '}
                          jobs
                        </span>
                        {l.ratingCount > 0 ? (
                          <span className="text-gray-600">
                            <span className="text-amber-500">★</span> {l.ratingAverage.toFixed(1)}{' '}
                            <span className="text-gray-400">({l.ratingCount})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No ratings</span>
                        )}
                        <StatusPill
                          status={l.is_active ? 'active' : 'deactivated'}
                          label={l.is_active ? 'Active' : 'Inactive'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Advisories summary */}
      {can.advisories && advisoryCounts && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Advisories Summary</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">All</p>
              <p className="text-xl font-bold text-blue-700">{advisoryCounts.all}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Upcoming</p>
              <p className="text-xl font-bold text-amber-600">{advisoryCounts.upcoming}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Active</p>
              <p className="text-xl font-bold text-green-600">{advisoryCounts.active}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-xl font-bold text-gray-900">{advisoryCounts.completed}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}