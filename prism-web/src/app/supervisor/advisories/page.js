'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { toast } from "@/lib/toast";
import usePagination from '@/lib/usePagination'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import Button, { ButtonLink } from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import DataTable from '@/components/ui/DataTable'
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import StatCard, { StatCardGrid } from '@/components/ui/StatCard'
import AdvisoryRow from '@/components/advisories/AdvisoryRow'
import AdvisoryFormModal from '@/components/advisories/AdvisoryFormModal'
import EmptyState from '@/components/ui/EmptyState'

const COLUMNS = [
  'Advisory Title',
  'Date',
  'Start Time',
  'End Time',
  'Status',
  'Affected Scope',
  'Actions',
]

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

    const coopId = await getMyCooperativeId(supabase)

    if (!coopId) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    setCooperativeId(coopId)

    const { data: advisoryData, error: advisoryError } = await supabase
      .from('advisories')
      .select('*')
      .eq('cooperative_id', coopId)
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

  // Archive = hide it, but keep the advisory (and its photo) in the database.
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

  // Normal view shows only active advisories, the archive view only archived ones
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

  const pg = usePagination(filtered)

  const statusCards = [
    { key: 'all', label: 'All Advisories', color: 'text-blue-700' },
    { key: 'upcoming', label: 'Upcoming', color: 'text-amber-600' },
    { key: 'active', label: 'Active', color: 'text-green-600' },
    { key: 'completed', label: 'Completed', color: 'text-gray-900' },
  ]

  return (
    <div>
      <PageHeader
        title={showArchived ? 'Archived Advisories' : 'Advisories Management'}
        description={
          showArchived
            ? 'Archived advisories are hidden from consumers. Restore one to make it active again.'
            : 'Manage and track service interruptions and maintenance schedules.'
        }
      />

      <StatCardGrid>
        {statusCards.map((c) => (
          <StatCard
            key={c.key}
            label={c.label}
            value={counts[c.key]}
            color={c.color}
            active={statusFilter === c.key}
            onClick={() => {
              setStatusFilter(c.key)
              pg.setPage(1)
            }}
          />
        ))}
      </StatCardGrid>

      <FilterBar>
        <FilterSelect
          label="AREA"
          value={areaFilter}
          onChange={(value) => {
            setAreaFilter(value)
            pg.setPage(1)
          }}
        >
          <option>All Area</option>
          {allAreaValues.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </FilterSelect>
        <div className="flex items-center gap-3">
          <ButtonLink
            href="/supervisor/service-areas"
            variant="plain"
            dim={false}
            className="whitespace-nowrap"
          >
            Manage Service Areas
          </ButtonLink>
          <Button
            variant="plain"
            dim={false}
            className="whitespace-nowrap"
            onClick={() => {
              setShowArchived(!showArchived)
              setStatusFilter('all')
              setAreaFilter('All Area')
              pg.setPage(1)
            }}
          >
            {showArchived ? 'Back to Advisories' : 'View Archive'}
          </Button>
          {!showArchived && (
            <Button
              dim={false}
              className="whitespace-nowrap"
              onClick={() => setShowCreateModal(true)}
            >
              + Create New Advisory
            </Button>
          )}
        </div>
      </FilterBar>

      <Alert>{error}</Alert>

      <DataTable
        columns={COLUMNS}
        loading={loading}
        loadingRow={null}
        isEmpty={filtered.length === 0}
        empty={
          <EmptyState
            title={showArchived ? 'No archived advisories' : 'No advisories match this view'}
            description={
              showArchived
                ? 'Advisories you archive will show up here.'
                : 'Try a different filter, or create a new advisory.'
            }
          />
        }
        footer={!loading && <Pagination {...pg.paginationProps} />}
      >
        {pg.pageItems.map((a) => (
          <AdvisoryRow
            key={a.advisory_id}
            advisory={a}
            archived={showArchived}
            onEdit={setEditingAdvisory}
            onDelete={setDeletingAdvisory}
            onRestore={handleRestore}
          />
        ))}
      </DataTable>

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
        <ConfirmDialog
          title="Archive Advisory"
          confirmLabel="Archive"
          onConfirm={handleArchiveConfirmed}
          onClose={() => setDeletingAdvisory(null)}
        >
          Are you sure you want to archive "
          <span className="font-semibold">{deletingAdvisory.title}</span>"? It will be hidden
          from consumers, but you can restore it later from the archive.
        </ConfirmDialog>
      )}
    </div>
  )
}