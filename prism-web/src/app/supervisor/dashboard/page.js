'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatMinutes, summarizeRatings } from '@/lib/performance'
import { usePermissions } from '@/lib/supervisor/PermissionsContext'
import { PageLoading } from "@/components/ui/Skeleton";

const MAX_ROWS = 1000 // Supabase returns at most 1000 rows per request

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

async function loadDispatchData(supabase, coopId, sinceIso) {
  // ---- Reports in the selected period ----
  let reportQuery = supabase
    .from('reports')
    .select('report_id, status, barangay, created_at, master_id')
    .eq('cooperative_id', coopId)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS)
  if (sinceIso) reportQuery = reportQuery.gte('created_at', sinceIso)

  const { data: reportsData, error: reportsError } = await reportQuery
  if (reportsError) throw new Error(reportsError.message)
  const reports = reportsData || []

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
    .select('assignment_id, report_id, master_id, status, assigned_at, completed_at')
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
  Object.entries(assignmentsByTicket).forEach(([key, list]) => {
    const firstAssigned = Math.min(...list.map((a) => new Date(a.assigned_at).getTime()))
    const response = (firstAssigned - ticketStart[key]) / 60000
    if (response >= 0) responseTimes.push(response)

    const finished = list.filter((a) => a.status === 'resolved' && a.completed_at)
    if (finished.length > 0) {
      const lastCompleted = Math.max(...finished.map((a) => new Date(a.completed_at).getTime()))
      const repair = (lastCompleted - firstAssigned) / 60000
      if (repair >= 0) repairTimes.push(repair)
    }
  })

  // ---- By barangay (top 5) ----
  const barangayMap = {}
  reports.forEach((r) => {
    if (!r.barangay) return
    barangayMap[r.barangay] = (barangayMap[r.barangay] || 0) + 1
  })
  const barangayData = Object.entries(barangayMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // ---- Last 7 days trend (always the most recent 7 days) ----
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  const dailyTrend = days.map((d) => {
    const dayStr = d.toDateString()
    const count = reports.filter((r) => new Date(r.created_at).toDateString() === dayStr).length
    return { label: d.toLocaleDateString('en-PH', { weekday: 'short' }), count }
  })

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
    },
    barangayData,
    dailyTrend,
    statusCounts,
    linemenPerformance,
    truncated: reports.length >= MAX_ROWS || assignments.length >= MAX_ROWS,
  }
}

async function loadAdvisorySummary(supabase, coopId) {
  const { data: advisories } = await supabase
    .from('advisories')
    .select('date, start_time, end_time')
    .eq('cooperative_id', coopId)

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
        supabase.rpc('get_lineman_duty_status'),
      ]).then(([reopenRes, overdueRes, dutyRes]) => {
        out.reopen = reopenRes.count ?? 0
        out.overdue = (overdueRes.data || []).length
        const dutyRows = dutyRes.data || []
        out.onDuty = dutyRows.filter((d) => d.is_available).length
        out.linemenTotal = dutyRows.length
      })
    )
  }

  if (can.billing) {
    tasks.push(
      supabase
        .from('consumer_bill_links')
        .select('link_id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then((res) => {
          out.billing = res.count ?? 0
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
  const { hasFeature, isOwner } = usePermissions()
  const can = {
    dispatch: hasFeature('dispatch'),
    advisories: hasFeature('advisories'),
    faq: hasFeature('faq'),
    billing: hasFeature('billing'),
  }
  const hasAnyWidget = can.dispatch || can.advisories || can.faq || can.billing

  const [rangeKey, setRangeKey] = useState('30')
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
      can.dispatch ? loadDispatchData(supabase, coopId, sinceIso) : null,
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

  const { stats, barangayData, dailyTrend, statusCounts, linemenPerformance, advisoryCounts, attention } = data
  const maxBarangayCount = Math.max(...(barangayData || []).map(([, c]) => c), 1)
  const maxTrendCount = Math.max(...(dailyTrend || []).map((d) => d.count), 1)

  // Needs-attention cards: only the ones this supervisor can act on
  const attentionItems = []
  if (can.dispatch && statusCounts) {
    attentionItems.push(
      { key: 'pending', label: 'Pending reports', count: statusCounts.pending, href: '/supervisor/dispatch', color: 'text-red-600' },
      { key: 'overdue', label: 'Overdue tickets', count: attention.overdue ?? 0, href: '/supervisor/dispatch', color: 'text-red-600' },
      { key: 'qa', label: 'QA reviews waiting', count: statusCounts.qa_review, href: '/supervisor/dispatch', color: 'text-blue-700' },
      { key: 'reopen', label: 'Reopen requests', count: attention.reopen ?? 0, href: '/supervisor/dispatch', color: 'text-amber-600' }
    )
  }
  if (can.billing) {
    attentionItems.push({ key: 'billing', label: 'Billing requests', count: attention.billing ?? 0, href: '/supervisor/billing', color: 'text-amber-600' })
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 tracking-wide">PERIOD</span>
              <select
                value={rangeKey}
                onChange={(e) => setRangeKey(e.target.value)}
                disabled={refreshing}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white disabled:opacity-60"
              >
                {RANGES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated{' '}
              {lastUpdated.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
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
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          {/* Top stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                Total Outage Reports
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
              {stats.declinedReports > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{stats.declinedReports} declined</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Reports Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvedReports}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Avg. Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatMinutes(stats.avgResponse)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Submission to first dispatch</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Avg. Repair Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatMinutes(stats.avgRepair)}</p>
              <p className="text-xs text-gray-400 mt-0.5">First dispatch to completion</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Outage reports by barangay */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Outage Reports by Barangay</h2>
              {barangayData.length === 0 && (
                <p className="text-sm text-gray-500">No reports in this period.</p>
              )}
              <div className="space-y-3">
                {barangayData.map(([barangay, count]) => (
                  <div key={barangay}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{barangay}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-700 h-2 rounded-full"
                        style={{ width: `${(count / maxBarangayCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reports per day */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Reports per Day</h2>
              <p className="text-xs text-gray-400 mb-4">Last 7 days trend</p>
              <div className="flex items-end justify-between gap-2 h-32">
                {dailyTrend.map((d) => (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-gray-700">{d.count}</span>
                    <div
                      className="w-full bg-blue-200 rounded-t"
                      style={{ height: `${Math.max(4, (d.count / maxTrendCount) * 80)}px` }}
                    />
                    <span className="text-[10px] text-gray-400">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Dispatch status overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Dispatch Status Overview</h2>
              <p className="text-xs text-gray-400 mb-4">Current, all tickets</p>
              <div className="grid grid-cols-3 gap-4">
                {STATUS_CARDS.map((s) => (
                  <div key={s.key}>
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{statusCounts[s.key]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Linemen on duty now */}
            {attention.linemenTotal != null && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Linemen On Duty Now</h2>
                <p className="text-xs text-gray-400 mb-4">
                  On shift (or on call) and reporting a location recently
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {attention.onDuty}
                  <span className="text-lg text-gray-400 font-semibold">
                    {' '}
                    / {attention.linemenTotal}
                  </span>
                </p>
                {isOwner && (
                  <Link
                    href="/supervisor/users"
                    className="inline-block text-xs font-semibold text-blue-700 mt-3"
                  >
                    View lineman list
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Top lineman performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Top Lineman Performance</h2>
              <Link href="/supervisor/lineman-performance" className="text-xs font-semibold text-blue-700">
                View all
              </Link>
            </div>
            {linemenPerformance.length === 0 && (
              <p className="text-sm text-gray-500">No completed jobs in this period.</p>
            )}
            <div className="space-y-3">
              {linemenPerformance.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {l.first_name[0]}
                      {l.last_name[0]}
                    </div>
                    <span className="text-gray-900 font-medium">
                      {l.first_name} {l.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">{l.jobsCompleted} jobs</span>
                    {l.ratingCount > 0 ? (
                      <span className="text-gray-600">
                        <span className="text-amber-500">★</span> {l.ratingAverage.toFixed(1)}{' '}
                        <span className="text-gray-400">({l.ratingCount})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No ratings</span>
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        l.is_active ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {l.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Advisories summary */}
      {can.advisories && advisoryCounts && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
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