'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/ui/Pagination'

const PRIORITIES = ['low', 'medium', 'high', 'critical']
const PAGE_SIZE = 10

const priorityStyles = {
  low: 'bg-blue-50 text-blue-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
  critical: 'bg-red-100 text-red-800',
}

// Maps the more detailed job_assignments.status onto the coarser
// reports.status "bucket" it belongs to, so counts/filters/table all agree.
const ASSIGNMENT_TO_BUCKET = {
  assigned: 'dispatched',
  on_the_way: 'dispatched',
  arrived_at_site: 'in_progress',
  in_progress: 'in_progress',
  fixed: 'qa_review',
  resolved: 'resolved',
}

const bucketColor = {
  pending: 'text-red-600',
  dispatched: 'text-amber-600',
  in_progress: 'text-amber-600',
  qa_review: 'text-blue-600',
  resolved: 'text-green-600',
  cancelled: 'text-gray-400',
}

function labelize(value) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function DispatchPage() {
  const [reports, setReports] = useState([])
  const [assignments, setAssignments] = useState([])
  const [linemenNames, setLinemenNames] = useState({})
  const [clusters, setClusters] = useState([])
  const [masterTickets, setMasterTickets] = useState([])

  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEverything()
  }, [])

  async function loadEverything() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: myRow, error: myRowError } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()

    if (myRowError || !myRow) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    const coopId = myRow.cooperative_id

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('cooperative_id', coopId)
      .order('created_at', { ascending: false })

    if (reportError) setError(reportError.message)

    // Reports already folded into a master ticket are represented by that
    // ticket instead, not listed individually anymore.
    const standaloneReports = (reportData || []).filter((r) => !r.master_id)
    setReports(standaloneReports)

    const { data: masterData, error: masterError } = await supabase
      .from('master_tickets')
      .select('*')
      .eq('cooperative_id', coopId)
      .order('created_at', { ascending: false })

    if (masterError) setError((prev) => prev || masterError.message)
    setMasterTickets(masterData || [])

    const reportIds = standaloneReports.map((r) => r.report_id)
    const masterIds = (masterData || []).map((m) => m.master_id)

    let assignmentData = []
    if (reportIds.length > 0) {
      const { data } = await supabase
        .from('job_assignments')
        .select('*')
        .in('report_id', reportIds)
        .order('assigned_at', { ascending: false })
      assignmentData = [...assignmentData, ...(data || [])]
    }
    if (masterIds.length > 0) {
      const { data } = await supabase
        .from('job_assignments')
        .select('*')
        .in('master_id', masterIds)
        .order('assigned_at', { ascending: false })
      assignmentData = [...assignmentData, ...(data || [])]
    }
    setAssignments(assignmentData)

    const linemanIds = Array.from(
      new Set(assignmentData.map((a) => a.lineman_id).filter(Boolean))
    )
    let namesMap = {}
    if (linemanIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', linemanIds)
      ;(data || []).forEach((u) => {
        namesMap[u.id] = `${u.first_name} ${u.last_name}`
      })
    }
    setLinemenNames(namesMap)

    const { data: clusterData, error: clusterError } = await supabase.rpc(
      'get_duplicate_clusters',
      { p_cooperative_id: coopId }
    )
    if (clusterError) setError((prev) => prev || clusterError.message)
    setClusters(clusterData || [])

    setLoading(false)
  }

  function assignmentFor(reportId, masterId) {
    return assignments.find(
      (a) => (reportId && a.report_id === reportId) || (masterId && a.master_id === masterId)
    )
  }

  // The single source of truth for "what bucket is this report really in"
  function bucketFor(report) {
    const assignment = assignmentFor(report.report_id)
    if (assignment) {
      return ASSIGNMENT_TO_BUCKET[assignment.status] || report.status
    }
    return report.status
  }

  function displayStatus(report) {
    const assignment = assignmentFor(report.report_id)
    return assignment ? assignment.status : report.status
  }

  const allTickets = [
    ...reports.map((r) => ({ ...r, kind: 'report', ticketKey: r.report_id })),
    ...masterTickets.map((m) => ({ ...m, kind: 'master', ticketKey: m.master_id })),
  ]

  function bucketForTicket(ticket) {
    const assignment =
      ticket.kind === 'report'
        ? assignmentFor(ticket.report_id, null)
        : assignmentFor(null, ticket.master_id)
    if (assignment) {
      return ASSIGNMENT_TO_BUCKET[assignment.status] || ticket.status
    }
    return ticket.status
  }

  const counts = {
    pending: allTickets.filter((t) => bucketForTicket(t) === 'pending').length,
    dispatched: allTickets.filter((t) => bucketForTicket(t) === 'dispatched').length,
    in_progress: allTickets.filter((t) => bucketForTicket(t) === 'in_progress').length,
    qa_review: allTickets.filter((t) => bucketForTicket(t) === 'qa_review').length,
    resolved: allTickets.filter((t) => bucketForTicket(t) === 'resolved').length,
  }

  const filtered = allTickets.filter((t) => {
    const priorityMatch = priorityFilter === 'all' || t.priority === priorityFilter
    const statusMatch = statusFilter === 'all' || bucketForTicket(t) === statusFilter
    return priorityMatch && statusMatch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clusteredReportIds = new Set(clusters.flatMap((c) => c.report_ids || []))

  function handleFilterChange(setter, value) {
    setter(value)
    setPage(1)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dispatch Management</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Real-time tickets monitoring and lineman coordination.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Pending"
          value={counts.pending}
          color="text-red-600"
          active={statusFilter === 'pending'}
          onClick={() =>
            handleFilterChange(setStatusFilter, statusFilter === 'pending' ? 'all' : 'pending')
          }
        />
        <StatCard
          label="Dispatched"
          value={counts.dispatched}
          color="text-amber-600"
          active={statusFilter === 'dispatched'}
          onClick={() =>
            handleFilterChange(setStatusFilter, statusFilter === 'dispatched' ? 'all' : 'dispatched')
          }
        />
        <StatCard
          label="In Progress"
          value={counts.in_progress}
          color="text-green-600"
          active={statusFilter === 'in_progress'}
          onClick={() =>
            handleFilterChange(setStatusFilter, statusFilter === 'in_progress' ? 'all' : 'in_progress')
          }
        />
        <StatCard
          label="QA Review"
          value={counts.qa_review}
          color="text-blue-700"
          active={statusFilter === 'qa_review'}
          onClick={() =>
            handleFilterChange(setStatusFilter, statusFilter === 'qa_review' ? 'all' : 'qa_review')
          }
        />
        <StatCard
          label="Resolved"
          value={counts.resolved}
          color="text-gray-900"
          active={statusFilter === 'resolved'}
          onClick={() =>
            handleFilterChange(setStatusFilter, statusFilter === 'resolved' ? 'all' : 'resolved')
          }
        />
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 tracking-wide">PRIORITY</span>
            <select
              value={priorityFilter}
              onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {labelize(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 tracking-wide">
              JOB ORDER STATUS
            </span>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="all">All Statuses</option>
              {Object.keys(counts).map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <Link
          href="/supervisor/dispatch/create-master-ticket"
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors inline-block"
        >
          + Create Master Ticket
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {clusters.map((cluster) => (
        <div
          key={cluster.cluster_anchor_id}
          className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              ⚟
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">POTENTIAL DUPLICATE</p>
              <p className="text-sm text-gray-600">
                <span className="text-blue-700 font-medium">{cluster.area_label}</span>
                {'   '}Confidence:{' '}
                <span className="font-semibold text-green-600">{cluster.confidence}%</span>
                {'   '}Related Reports:{' '}
                <span className="font-semibold">{cluster.related_count}</span>
                {'   '}Status: Pending Administrator Review
              </p>
            </div>
          </div>
          <Link
            href={`/supervisor/dispatch/cluster/${cluster.cluster_anchor_id}`}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Review Cluster
          </Link>
        </div>
      ))}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Ticket ID</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold">Job Order Status</th>
              <th className="px-5 py-3 font-semibold">Assignee</th>
              <th className="px-5 py-3 font-semibold">Last Updated</th>
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
            {!loading && paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  No tickets match this view.
                </td>
              </tr>
            )}
            {!loading &&
              paginated.map((t) => {
                const isMaster = t.kind === 'master'
                const assignment = isMaster
                  ? assignmentFor(null, t.master_id)
                  : assignmentFor(t.report_id, null)
                const bucket = bucketForTicket(t)
                const status = assignment ? assignment.status : t.status
                const isClustered = !isMaster && clusteredReportIds.has(t.report_id)
                const isReviewable = !isMaster && !assignment && t.status === 'pending'
                const detailHref = isMaster
                  ? `/supervisor/dispatch/master/${t.master_id}`
                  : `/supervisor/dispatch/report/${t.report_id}`

                return (
                  <tr key={t.ticketKey} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {isMaster ? t.master_ticket : t.ticket_number}
                        {isMaster && (
                          <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            MASTER · {t.report_count}
                          </span>
                        )}
                      </p>
                      {isClustered && (
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          Highly Likely Duplicate
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {t.priority ? (
                        <span
                          className={`inline-block text-xs font-bold px-2 py-0.5 rounded uppercase ${priorityStyles[t.priority]}`}
                        >
                          {t.priority}
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded uppercase bg-gray-100 text-gray-500">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {isMaster
                          ? `${t.barangay}, ${t.municipality}`
                          : t.nearest_landmark || `${t.barangay}, ${t.municipality}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {!isMaster && `Zone ${t.zone || '—'}, `}
                        {t.barangay}, {t.municipality} • {formatTime(t.created_at)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${bucketColor[bucket]}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {labelize(status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {assignment
                        ? linemenNames[assignment.lineman_id] || 'Assigned'
                        : 'Unassigned'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {formatDateTime(
                        assignment?.updated_at || assignment?.assigned_at || t.updated_at || t.created_at
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isReviewable ? (
                        <Link
                          href={detailHref}
                          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors inline-block"
                        >
                          Review
                        </Link>
                      ) : (
                        <Link
                          href={detailHref}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors inline-block"
                        >
                          Details
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>

        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
        
      </div>
    </div>
  )
}

function StatCard({ label, value, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-xl border p-4 transition-all ${
        active ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </button>
  )
}