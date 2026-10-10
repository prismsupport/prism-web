'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { summarizeRatings } from '@/lib/performance'

const DAYS_RANGE = 30

function formatMinutes(minutes) {
  if (minutes == null || isNaN(minutes)) return '—'
  if (minutes < 60) return `${Math.round(minutes)} mins`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}hr ${mins}m`
}

export default function SupervisorDashboardPage() {
  const [stats, setStats] = useState(null)
  const [barangayData, setBarangayData] = useState([])
  const [dailyTrend, setDailyTrend] = useState([])
  const [statusCounts, setStatusCounts] = useState(null)
  const [linemenPerformance, setLinemenPerformance] = useState([])
  const [advisoryCounts, setAdvisoryCounts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: myRow } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()

    if (!myRow) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    const coopId = myRow.cooperative_id
    const since = new Date()
    since.setDate(since.getDate() - DAYS_RANGE)
    const sinceIso = since.toISOString()

    // ---- Reports in range ----
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('report_id, status, barangay, created_at, master_id')
      .eq('cooperative_id', coopId)
      .gte('created_at', sinceIso)

    if (reportsError) setError(reportsError.message)

    const totalReports = reports?.length || 0
    const resolvedReports = reports?.filter((r) => r.status === 'resolved').length || 0

    // ---- Assignments in range (for response/repair time averages) ----
    const reportIds = (reports || []).map((r) => r.report_id)
    let assignments = []
    if (reportIds.length > 0) {
      const { data } = await supabase
        .from('job_assignments')
        .select('report_id, assigned_at, completed_at')
        .in('report_id', reportIds)
      assignments = data || []
    }

    const responseTimes = []
    const repairTimes = []
    assignments.forEach((a) => {
      const report = reports.find((r) => r.report_id === a.report_id)
      if (report && a.assigned_at) {
        const minutes =
          (new Date(a.assigned_at) - new Date(report.created_at)) / 60000
        if (minutes >= 0) responseTimes.push(minutes)
      }
      if (a.assigned_at && a.completed_at) {
        const minutes = (new Date(a.completed_at) - new Date(a.assigned_at)) / 60000
        if (minutes >= 0) repairTimes.push(minutes)
      }
    })

    const avgResponse =
      responseTimes.length > 0
        ? responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length
        : null
    const avgRepair =
      repairTimes.length > 0
        ? repairTimes.reduce((s, v) => s + v, 0) / repairTimes.length
        : null

    setStats({
      totalReports,
      resolvedReports,
      avgResponse,
      avgRepair,
    })

    // ---- By barangay (top 5) ----
    const barangayMap = {}
    ;(reports || []).forEach((r) => {
      if (!r.barangay) return
      barangayMap[r.barangay] = (barangayMap[r.barangay] || 0) + 1
    })
    const sortedBarangays = Object.entries(barangayMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    setBarangayData(sortedBarangays)

    // ---- Last 7 days trend ----
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d)
    }
    const trend = days.map((d) => {
      const dayStr = d.toDateString()
      const count = (reports || []).filter(
        (r) => new Date(r.created_at).toDateString() === dayStr
      ).length
      return { label: d.toLocaleDateString('en-PH', { weekday: 'short' }), count }
    })
    setDailyTrend(trend)

    // ---- Dispatch status overview (current, not time-limited) ----
    const { data: allReports } = await supabase
      .from('reports')
      .select('status, master_id')
      .eq('cooperative_id', coopId)

    const { data: allMasters } = await supabase
      .from('master_tickets')
      .select('status')
      .eq('cooperative_id', coopId)

    const standalone = (allReports || []).filter((r) => !r.master_id)
    const combined = [...standalone.map((r) => r.status), ...(allMasters || []).map((m) => m.status)]

    setStatusCounts({
      pending: combined.filter((s) => s === 'pending').length,
      dispatched: combined.filter((s) => s === 'dispatched').length,
      in_progress: combined.filter((s) => s === 'in_progress' || s === 'qa_review').length,
      resolved: combined.filter((s) => s === 'resolved').length,
    })

    // ---- Top lineman performance ----
    const { data: linemenUsers } = await supabase
      .from('users')
      .select('id, first_name, last_name, is_active')
      .eq('cooperative_id', coopId)
      .eq('user_type', 'lineman')

    const { data: completedAssignments } = await supabase
      .from('job_assignments')
      .select('lineman_id')
      .eq('status', 'resolved')
      .gte('completed_at', sinceIso)

    const performance = (linemenUsers || [])
      .map((l) => ({
        ...l,
        jobsCompleted: (completedAssignments || []).filter(
          (a) => a.lineman_id === l.id
        ).length,
      }))
      .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
      .slice(0, 5)

    // Consumer satisfaction ratings for these linemen, same period as the jobs count
    const topIds = performance.map((l) => l.id)
    let ratingRows = []
    if (topIds.length > 0) {
      const { data: ratingData } = await supabase
        .from('job_ratings')
        .select('lineman_id, rating')
        .in('lineman_id', topIds)
        .gte('created_at', sinceIso)
      ratingRows = ratingData || []
    }

    const performanceWithRatings = performance.map((l) => ({
      ...l,
      ...summarizeRatings(ratingRows.filter((r) => r.lineman_id === l.id)),
    }))

    setLinemenPerformance(performanceWithRatings)

    // ---- Advisories summary ----
    const { data: advisories } = await supabase
      .from('advisories')
      .select('date, start_time, end_time')
      .eq('cooperative_id', coopId)

    const now = new Date()
    let upcoming = 0,
      active = 0,
      completed = 0
    ;(advisories || []).forEach((a) => {
      const start = new Date(`${a.date}T${a.start_time}`)
      const end = new Date(`${a.date}T${a.end_time}`)
      if (now < start) upcoming++
      else if (now >= start && now <= end) active++
      else completed++
    })

    setAdvisoryCounts({
      all: (advisories || []).length,
      upcoming,
      active,
      completed,
    })

    setLoading(false)
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  const maxBarangayCount = Math.max(...barangayData.map(([, c]) => c), 1)
  const maxTrendCount = Math.max(...dailyTrend.map((d) => d.count), 1)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Service Analytics Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Monitor real-time and historical performance of outage reporting, dispatch,
        and repair operations. (Last {DAYS_RANGE} days)
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">
            Total Outage Reports
          </p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">
            Reports Resolved
          </p>
          <p className="text-2xl font-bold text-green-600">{stats.resolvedReports}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">
            Avg. Response Time
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatMinutes(stats.avgResponse)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Submission to dispatch</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">
            Avg. Repair Time
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatMinutes(stats.avgRepair)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Dispatch to completion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Outage reports by barangay */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">
            Outage Reports by Barangay
          </h2>
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
                  style={{
                    height: `${Math.max(4, (d.count / maxTrendCount) * 80)}px`,
                  }}
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
          <h2 className="text-sm font-bold text-gray-900 mb-4">
            Dispatch Status Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Pending</p>
              <p className="text-xl font-bold text-red-600">{statusCounts.pending}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Dispatched</p>
              <p className="text-xl font-bold text-amber-600">
                {statusCounts.dispatched}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-amber-600">
                {statusCounts.in_progress}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-xl font-bold text-green-600">
                {statusCounts.resolved}
              </p>
            </div>
          </div>
        </div>

        {/* Top lineman performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Top Lineman Performance</h2>
            <Link
              href="/supervisor/lineman-performance"
              className="text-xs font-semibold text-blue-700"
            >
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
      </div>

      {/* Advisories summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Advisories Summary</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">All</p>
            <p className="text-xl font-bold text-blue-700">{advisoryCounts.all}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Upcoming</p>
            <p className="text-xl font-bold text-amber-600">
              {advisoryCounts.upcoming}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Active</p>
            <p className="text-xl font-bold text-green-600">{advisoryCounts.active}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-xl font-bold text-gray-900">
              {advisoryCounts.completed}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}