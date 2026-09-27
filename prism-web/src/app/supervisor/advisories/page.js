'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import StatCard from '@/components/ui/StatCard'
import AdvisoryRow from '@/components/advisories/AdvisoryRow'
import AdvisoryFormModal from '@/components/advisories/AdvisoryFormModal'

const PAGE_SIZE = 10

// Compares "now" against the advisory's date/start_time/end_time to
// determine its real-time status — nothing is trusted from a stored value.
function computeStatus(advisory) {
  const now = new Date()
  const start = new Date(`${advisory.date}T${advisory.start_time}`)
  const end = new Date(`${advisory.date}T${advisory.end_time}`)

  if (now < start) return 'upcoming'
  if (now >= start && now <= end) return 'active'
  return 'completed'
}

export default function AdvisoriesPage() {
  const [cooperativeId, setCooperativeId] = useState(null)
  const [advisories, setAdvisories] = useState([])
  const [areaFilter, setAreaFilter] = useState('All Area')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAdvisory, setEditingAdvisory] = useState(null)
  const [deletingAdvisory, setDeletingAdvisory] = useState(null)

  useEffect(() => {
    loadAdvisories()
  }, [])

  async function loadAdvisories() {
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

    setCooperativeId(myRow.cooperative_id)

    const { data: advisoryData, error: advisoryError } = await supabase
      .from('advisories')
      .select('*')
      .eq('cooperative_id', myRow.cooperative_id)
      .order('date', { ascending: false })

    if (advisoryError) setError(advisoryError.message)

    const advisoryIds = (advisoryData || []).map((a) => a.advisory_id)
    let targets = []
    if (advisoryIds.length > 0) {
      const { data } = await supabase
        .from('advisory_target')
        .select('*')
        .in('advisory_id', advisoryIds)
      targets = data || []
    }

    const merged = (advisoryData || []).map((a) => ({
      ...a,
      targets: targets.filter((t) => t.advisory_id === a.advisory_id),
      computedStatus: computeStatus(a),
    }))

    setAdvisories(merged)
    setLoading(false)
  }

  async function handleDeleteConfirmed() {
    const supabase = createClient()
    // advisory_target rows are removed automatically via "on delete cascade"
    await supabase
      .from('advisories')
      .delete()
      .eq('advisory_id', deletingAdvisory.advisory_id)
    setDeletingAdvisory(null)
    loadAdvisories()
  }

  const allAreaValues = Array.from(
    new Set(
      advisories.flatMap((a) =>
        a.targets.map((t) =>
          t.scope_type === 'entire_cooperative' ? 'Entire Cooperative' : t.target_value
        )
      )
    )
  ).filter(Boolean)

  const counts = {
    all: advisories.length,
    upcoming: advisories.filter((a) => a.computedStatus === 'upcoming').length,
    active: advisories.filter((a) => a.computedStatus === 'active').length,
    completed: advisories.filter((a) => a.computedStatus === 'completed').length,
  }

  const filtered = advisories.filter((a) => {
    const statusMatch = statusFilter === 'all' || a.computedStatus === statusFilter
    const areaMatch =
      areaFilter === 'All Area' ||
      a.targets.some(
        (t) =>
          t.target_value === areaFilter ||
          (t.scope_type === 'entire_cooperative' && areaFilter === 'Entire Cooperative')
      )
    return statusMatch && areaMatch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Advisories Management</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Manage and track service interruptions and maintenance schedules.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="All Advisories"
          value={counts.all}
          color="text-blue-700"
          active={statusFilter === 'all'}
          onClick={() => {
            setStatusFilter('all')
            setPage(1)
          }}
        />
        <StatCard
          label="Upcoming"
          value={counts.upcoming}
          color="text-amber-600"
          active={statusFilter === 'upcoming'}
          onClick={() => {
            setStatusFilter('upcoming')
            setPage(1)
          }}
        />
        <StatCard
          label="Active"
          value={counts.active}
          color="text-green-600"
          active={statusFilter === 'active'}
          onClick={() => {
            setStatusFilter('active')
            setPage(1)
          }}
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          color="text-gray-900"
          active={statusFilter === 'completed'}
          onClick={() => {
            setStatusFilter('completed')
            setPage(1)
          }}
        />
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 tracking-wide">AREA</span>
          <select
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option>All Area</option>
            {allAreaValues.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          + Create New Advisory
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Advisory Title</th>
              <th className="px-5 py-3 font-semibold">Description</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Start Time</th>
              <th className="px-5 py-3 font-semibold">End Time</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Affected Scope</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                  No advisories match this view.
                </td>
              </tr>
            )}
            {!loading &&
              paginated.map((a) => (
                <AdvisoryRow key={a.advisory_id} advisory={a} onEdit={setEditingAdvisory} onDelete={setDeletingAdvisory} />
              ))}
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

      {(showCreateModal || editingAdvisory) && (
        <AdvisoryFormModal
          cooperativeId={cooperativeId}
          advisory={editingAdvisory}
          onClose={() => {
            setShowCreateModal(false)
            setEditingAdvisory(null)
          }}
          onSaved={() => {
            setShowCreateModal(false)
            setEditingAdvisory(null)
            loadAdvisories()
          }}
        />
      )}

      {deletingAdvisory && (
        <Modal title="Delete Advisory" onClose={() => setDeletingAdvisory(null)}>
          <p className="text-sm text-gray-700 mb-6">
            Are you sure you want to delete "
            <span className="font-semibold">{deletingAdvisory.title}</span>"? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingAdvisory(null)}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
