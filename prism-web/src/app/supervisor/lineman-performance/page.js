'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { formatMinutes, periodStartIso, summarizeRatings } from '@/lib/performance'
import LinemanRatingsModal from '@/components/performance/LinemanRatingsModal'
import BackButton from '@/components/ui/BackButton'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import DataTable from '@/components/ui/DataTable'
import { FilterSelect } from '@/components/ui/FilterBar'
import StatCard, { StatCardGrid } from '@/components/ui/StatCard'

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

const COLUMNS = [
  'Lineman',
  'Area Office',
  'Jobs Completed',
  'Avg. Repair Time',
  'Avg. Rating',
  'Ratings',
  'Actions',
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

    const coopId = await getMyCooperativeId(supabase)

    if (!coopId) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    const { data: linemenUsers, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, is_active')
      .eq('cooperative_id', coopId)
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

      <PageHeader
        className="mt-4"
        title="Lineman Performance"
        description="Jobs completed, repair time, and consumer satisfaction ratings for each lineman."
        actions={
          <div className="flex items-center gap-4">
            <FilterSelect
              label="PERIOD"
              value={periodIndex}
              onChange={(value) => setPeriodIndex(Number(value))}
            >
              {PERIODS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="SORT" value={sortKey} onChange={setSortKey}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </FilterSelect>
          </div>
        }
      />

      <Alert>{error}</Alert>

      {overall && (
        <StatCardGrid>
          <StatCard
            compact
            labelTracking=""
            label="Average Rating"
            value={
              overall.ratingCount > 0 ? (
                <>
                  <span className="text-amber-500">★</span> {overall.ratingAverage.toFixed(1)}
                </>
              ) : (
                '—'
              )
            }
          />
          <StatCard compact labelTracking="" label="Ratings Received" value={overall.ratingCount} />
          <StatCard
            compact
            labelTracking=""
            label="Jobs Completed"
            value={overall.jobsCompleted}
            color="text-green-600"
          />
          <StatCard
            compact
            labelTracking=""
            label="Avg. Repair Time"
            value={formatMinutes(overall.avgRepair)}
            hint="Dispatch to completion"
          />
        </StatCardGrid>
      )}

      <DataTable
        columns={COLUMNS}
        loading={loading}
        isEmpty={sorted.length === 0}
        empty="No lineman accounts yet."
      >
        {sorted.map((l) => (
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
      </DataTable>

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
