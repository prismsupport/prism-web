'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from "@/lib/toast";
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import StatCard from '@/components/ui/StatCard'
import AdvisoryRow from '@/components/advisories/AdvisoryRow'
import AdvisoryFormModal from '@/components/advisories/AdvisoryFormModal'
import EmptyState from '@/components/ui/EmptyState'

const PAGE_SIZE = 10

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
  const [showArchived, setShowArchived] = useState(false)

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

    // Resolve a temporary signed URL for each advisory's photo, if it has one
    const photoUrlMap = {}
    await Promise.all(
      (advisoryData || [])
        .filter((a) => a.photo_url)
        .map(async (a) => {
          const { data } = await supabase.storage
            .from('advisory-photos')
            .createSignedUrl(a.photo_url, 3600)
          if (data) photoUrlMap[a.advisory_id] = data.signedUrl
        })
    )

    const merged = (advisoryData || []).map((a) => ({
      ...a,
      targets: targets.filter((t) => t.advisory_id === a.advisory_id),
      computedStatus: computeStatus(a),
      photoSignedUrl: photoUrlMap[a.advisory_id] || null,
    }))

    setAdvisories(merged)
    setLoading(false)
  }

  // Archive = hide it, but keep the data (and its photo) in the database.
  async function handleArchiveConfirmed() {
    const supabase = createClient()

    const { data, error: archiveError } = await supabase
      .from('advisories')
      .update({ archived_at: new Date().toISOString() })
      .eq('advisory_id', deletingAdvisory.advisory_id)
      .select('advisory_id')

    if (archiveError || !data?.length) {
      toast.error(archiveError?.message || "Couldn't archive this advisory.")
      return
    }

    toast.success('Advisory archived')
    setDeletingAdvisory(null)
    await loadAdvisories()
  }

  async function handleRestore(advisory) {
    const supabase = createClient()

    const { error: restoreError } = await supabase
      .from('advisories')
      .update({ archived_at: null })
      .eq('advisory_id', advisory.advisory_id)

    if (restoreError) {
      toast.error(restoreError.message)
      return
    }

    toast.success('Advisory restored')
    await loadAdvisories()
  }

  // Only show archived ones in the archive view, and only active ones otherwise
  const visibleAdvisories = advisories.filter((a) =>
    showArchived ? a.archived_at : !a.archived_at
  )

  const allAreaValues = Array.from(
    new Set(
      visibleAdvisories.flatMap((a) =>
        a.targets.map((t) =>
          t.scope_type === 'entire_cooperative' ? 'Entire Cooperative' : t.target_value
        )
      )
    )
  ).filter(Boolean)

  const counts = {
    all: visibleAdvisories.length,
    upcoming: visibleAdvisories.filter((a) => a.computedStatus === 'upcoming').length,
    active: visibleAdvisories.filter((a) => a.computedStatus === 'active').length,
    completed: visibleAdvisories.filter((a) => a.computedStatus === 'completed').length,
  }

  const filtered = visibleAdvisories.filter((a) => {
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
      <h1 className="text-2xl font-bold text-gray-900">
        {showArchived ? 'Archived Advisories' : 'Advisories Management'}
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        {showArchived
          ? 'Archived advisories are hidden from consumers. Restore one to make it active again.'
          : 'Manage and track service interruptions and maintenance schedules.'}
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
            className="select-control text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option>All Area</option>
            {allAreaValues.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/supervisor/service-areas"
            className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
          >
            Manage Service Areas
          </Link>
          <button
            onClick={() => {
              setShowArchived(!showArchived)
              setStatusFilter('all')
              setAreaFilter('All Area')
              setPage(1)
            }}
            className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
          >
            {showArchived ? 'Back to Advisories' : 'View Archive'}
          </button>
          {!showArchived && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              + Create New Advisory
            </button>
          )}
        </div>
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
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Start Time</th>
              <th className="px-5 py-3 font-semibold">End Time</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Affected Scope</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title={showArchived ? 'No archived advisories' : 'No advisories match this view'}
                    description={
                      showArchived
                        ? 'Advisories you archive will show up here.'
                        : 'Try a different filter, or create a new advisory.'
                    }
                  />
                </td>
              </tr>
            )}
            {!loading &&
              paginated.map((a) => (
                <AdvisoryRow
                  key={a.advisory_id}
                  advisory={a}
                  archived={showArchived}
                  onEdit={setEditingAdvisory}
                  onDelete={setDeletingAdvisory}
                  onRestore={handleRestore}
                />
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
        <Modal title="Archive Advisory" onClose={() => setDeletingAdvisory(null)}>
          <p className="text-sm text-gray-700 mb-6">
            Are you sure you want to archive "
            <span className="font-semibold">{deletingAdvisory.title}</span>"? It will be hidden
            from consumers, but you can restore it later from the archive.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingAdvisory(null)}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleArchiveConfirmed}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
            >
              Archive
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}