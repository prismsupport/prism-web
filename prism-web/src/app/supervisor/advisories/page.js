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

  async function handleDeleteConfirmed() {
    const supabase = createClient()

    // Delete the advisory and check the database response.
    const { data, error: deleteError } = await supabase
      .from('advisories')
      .delete()
      .eq('advisory_id', deletingAdvisory.advisory_id)
      .select('advisory_id')

    // Show an error if the deletion failed or no row was deleted.
    if (deleteError || !data?.length) {
      toast.error(
        deleteError?.message || "Couldn't delete this advisory."
      )
      return
    }

    // Remove the attached photo after the advisory is deleted.
    if (deletingAdvisory.photo_url) {
      const { error: photoError } = await supabase.storage
        .from('advisory-photos')
        .remove([deletingAdvisory.photo_url])

      if (photoError) {
        console.error('Failed to remove advisory photo:', photoError)
      }
    }

    toast.success('Advisory deleted')
    setDeletingAdvisory(null)
    await loadAdvisories()
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
        title="Advisories Management"
        description="Manage and track service interruptions and maintenance schedules."
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
            dim={false}
            className="whitespace-nowrap"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Advisory
          </Button>
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
            title="No advisories match this view"
            description="Try a different filter, or create a new advisory."
          />
        }
        footer={!loading && <Pagination {...pg.paginationProps} />}
      >
        {pg.pageItems.map((a) => (
          <AdvisoryRow
            key={a.advisory_id}
            advisory={a}
            onEdit={setEditingAdvisory}
            onDelete={setDeletingAdvisory}
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
          title="Delete Advisory"
          onConfirm={handleDeleteConfirmed}
          onClose={() => setDeletingAdvisory(null)}
        >
          Are you sure you want to delete "
          <span className="font-semibold">{deletingAdvisory.title}</span>"? This
          action cannot be undone.
        </ConfirmDialog>
      )}
    </div>
  )
}
