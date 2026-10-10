'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatMinutes, periodStartIso, summarizeRatings } from '@/lib/performance'
import LinemanRatingsModal from '@/components/performance/LinemanRatingsModal'
import BackButton from '@/components/ui/BackButton'

const PERIODS = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: null },
]

const SORTS = [
  { key: 'rating', label: 'Highest rated' },
  { key: 'jobs', label: 'Most jobs completed' },
  { key: 'repair', label: 'Fastest average repair' },
  { key: 'name', label: 'Name (A-Z)' },
]

function compareNullable(a, b, descending) {
  if (a == null && b == null) return 0
  if (a == null) return 1 // rows with no data always go last
  if (b == null) return -1
  if (a === b) return 0
  return descending ? (b > a ? 1 : -1) : a > b ? 1 : -1
}

function sortRows(rows, key) {
  const copy = [...rows]
  if (key === 'rating') {
    copy.sort(
      (a, b) =>
        compareNullable(a.ratingAverage, b.ratingAverage, true) || b.ratingCount - a.ratingCount
    )
  } else if (key === 'jobs') {
    copy.sort((a, b) => b.jobsCompleted - a.jobsCompleted)
  } else if (key === 'repair') {
    copy.sort((a, b) => compareNullable(a.avgRepair, b.avgRepair, false))
  } else {
    copy.sort((a, b) => a.first_name.localeCompare(b.first_name))
  }
  return copy
}

export default function LinemanPerformancePage() {
  const [periodIndex, setPeriodIndex] = useState(0)
  const [sortKey, setSortKey] = useState('rating')
  const [linemen, setLinemen] = useState([])
  const [overall, setOverall] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const period = PERIODS[periodIndex]

  useEffect(() => {
    load(period.days)
  }, [periodIndex])

  async function load(days) {
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

    const { data: linemenUsers, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, is_active')
      .eq('cooperative_id', myRow.cooperative_id)
      .eq('user_type', 'lineman')

    if (usersError) {
      setError(usersError.message)
      setLoading(false)
      return
    }

    const ids = (linemenUsers || []).map((l) => l.id)
    if (ids.length === 0) {
      setLinemen([])
      setOverall(null)
      setLoading(false)
      return
    }

    const sinceIso = periodStartIso(days)

    let assignmentsQuery = supabase
      .from('job_assignments')
      .select('lineman_id, assigned_at, completed_at')
      .in('lineman_id', ids)
      .eq('status', 'resolved')

    let ratingsQuery = supabase
      .from('job_ratings')
      .select('rating_id, lineman_id, rating, comment, created_at, consumer_id, assignment_id')
      .in('lineman_id', ids)

    if (sinceIso) {
      assignmentsQuery = assignmentsQuery.gte('completed_at', sinceIso)
      ratingsQuery = ratingsQuery.gte('created_at', sinceIso)
    }

    const [officeRes, assignmentRes, ratingRes] = await Promise.all([
      supabase.from('lineman').select('profile_id, assigned_area_office').in('profile_id', ids),
      assignmentsQuery,
      ratingsQuery.order('created_at', { ascending: false }),
    ])

    const firstError = officeRes.error || assignmentRes.error || ratingRes.error
    if (firstError) setError(firstError.message)

    const assignments = assignmentRes.data || []
    const ratings = ratingRes.data || []

    const rows = (linemenUsers || []).map((l) => {
      const done = assignments.filter((a) => a.lineman_id === l.id)
      const repairTimes = done
        .filter((a) => a.assigned_at && a.completed_at)
        .map((a) => (new Date(a.completed_at) - new Date(a.assigned_at)) / 60000)
        .filter((m) => m >= 0)
      const myRatings = ratings.filter((r) => r.lineman_id === l.id)

      return {
        ...l,
        areaOffice:
          (officeRes.data || []).find((o) => o.profile_id === l.id)?.assigned_area_office || null,
        jobsCompleted: done.length,
        avgRepair:
          repairTimes.length > 0
            ? repairTimes.reduce((s, v) => s + v, 0) / repairTimes.length
            : null,
        ratings: myRatings,
        ...summarizeRatings(myRatings),
      }
    })

    const allRepairTimes = assignments
      .filter((a) => a.assigned_at && a.completed_at)
      .map((a) => (new Date(a.completed_at) - new Date(a.assigned_at)) / 60000)
      .filter((m) => m >= 0)

    setLinemen(rows)
    setOverall({
      ...summarizeRatings(ratings),
      jobsCompleted: assignments.length,
      avgRepair:
        allRepairTimes.length > 0
          ? allRepairTimes.reduce((s, v) => s + v, 0) / allRepairTimes.length
          : null,
    })
    setLoading(false)
  }

  const sorted = sortRows(linemen, sortKey)

  return (
    <div>
      <BackButton href="/supervisor/dashboard" label="Back to Dashboard" withMarginBottom />

      <div className="flex items-start justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lineman Performance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Jobs completed, repair time, and consumer satisfaction ratings for each lineman.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 tracking-wide">PERIOD</span>
            <select
              value={periodIndex}
              onChange={(e) => setPeriodIndex(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              {PERIODS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 tracking-wide">SORT</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {overall && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Average Rating</p>
            <p className="text-2xl font-bold text-gray-900">
              {overall.ratingCount > 0 ? (
                <>
                  <span className="text-amber-500">★</span> {overall.ratingAverage.toFixed(1)}
                </>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ratings Received</p>
            <p className="text-2xl font-bold text-gray-900">{overall.ratingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Jobs Completed</p>
            <p className="text-2xl font-bold text-green-600">{overall.jobsCompleted}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Avg. Repair Time</p>
            <p className="text-2xl font-bold text-gray-900">{formatMinutes(overall.avgRepair)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Dispatch to completion</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Lineman</th>
              <th className="px-5 py-3 font-semibold">Area Office</th>
              <th className="px-5 py-3 font-semibold">Jobs Completed</th>
              <th className="px-5 py-3 font-semibold">Avg. Repair Time</th>
              <th className="px-5 py-3 font-semibold">Avg. Rating</th>
              <th className="px-5 py-3 font-semibold">Ratings</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  No lineman accounts yet.
                </td>
              </tr>
            )}
            {!loading &&
              sorted.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {l.first_name} {l.last_name}
                    {!l.is_active && (
                      <span className="ml-2 text-xs font-semibold text-gray-400">Inactive</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{l.areaOffice || '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{l.jobsCompleted}</td>
                  <td className="px-5 py-4 text-gray-600">{formatMinutes(l.avgRepair)}</td>
                  <td className="px-5 py-4">
                    {l.ratingCount > 0 ? (
                      <span className="font-semibold text-gray-900">
                        <span className="text-amber-500">★</span> {l.ratingAverage.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No ratings</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{l.ratingCount}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelected(l)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Read each average together with its rating count, since an average based on one or two
        ratings says very little. Ratings also reflect the consumer's overall experience, which can
        be affected by things outside a lineman's control, such as the cause of the outage,
        available materials, or how long the consumer waited.
      </p>

      {selected && (
        <LinemanRatingsModal
          lineman={selected}
          periodLabel={period.label}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}