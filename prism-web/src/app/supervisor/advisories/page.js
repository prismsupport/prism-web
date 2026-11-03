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
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterMenu, FilterChips } from '@/components/ui/FilterMenu'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import StatCard, { StatCardGrid } from '@/components/ui/StatCard'
import AdvisoryRow from '@/components/advisories/AdvisoryRow'
import AdvisoryFormModal from '@/components/advisories/AdvisoryFormModal'
import EmptyState from '@/components/ui/EmptyState'
import ArchiveIcon from '@/components/ui/icons/ArchiveIcon'

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
  const [feederFilter, setFeederFilter] = useState('all')
  const [municipalityFilter, setMunicipalityFilter] = useState('all')
  const [barangayFilter, setBarangayFilter] = useState('all')
  const [cooperativeScopeFilter, setCooperativeScopeFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [serviceAreas, setServiceAreas] = useState([])
  const [searchText, setSearchText] = useState('')
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

    const [{ data: advisoryData, error: advisoryError }, { data: serviceAreaData, error: serviceAreaError }] =
      await Promise.all([
        supabase
          .from('advisories')
          .select('*')
          .eq('cooperative_id', coopId)
          .order('date', { ascending: false }),
        supabase
          .from('service_areas')
          .select('feeder, municipality, barangay')
          .eq('cooperative_id', coopId)
          .is('archived_at', null),
      ])

    if (advisoryError) setError(advisoryError.message)
    if (serviceAreaError) setError((current) => current || serviceAreaError.message)
    setServiceAreas(serviceAreaData || [])

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

  const feederOptions = Array.from(
    new Set(serviceAreas.map((a) => a.feeder).filter(Boolean))
  ).sort()

  const municipalityOptions = Array.from(
    new Set(serviceAreas.map((a) => a.municipality).filter(Boolean))
  ).sort()

  const barangayOptions = Array.from(
    new Map(
      serviceAreas
        .filter((a) => a.barangay && a.municipality)
        .map((a) => [
          `${a.barangay}|${a.municipality}`,
          `${a.barangay} (${a.municipality})`,
        ])
    ).values()
  ).sort()

  const counts = {
    all: visibleAdvisories.length,
    upcoming: visibleAdvisories.filter((a) => a.computedStatus === 'upcoming').length,
    active: visibleAdvisories.filter((a) => a.computedStatus === 'active').length,
    completed: visibleAdvisories.filter((a) => a.computedStatus === 'completed').length,
  }

  const monthOptions = Array.from(
    new Set(visibleAdvisories.map((advisory) => advisory.date?.slice(0, 7)).filter(Boolean))
  )
    .sort((a, b) => b.localeCompare(a))
    .map((month) => ({
      value: month,
      label: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
        new Date(`${month}-01T00:00:00`)
      ),
    }))

  const term = searchText.trim().toLowerCase()

  const filtered = visibleAdvisories.filter((a) => {
    const statusMatch = statusFilter === 'all' || a.computedStatus === statusFilter
    const monthMatch = monthFilter === 'all' || a.date?.startsWith(monthFilter)
    const feederMatch =
      feederFilter === 'all' ||
      a.targets.some((t) => t.scope_type === 'feeder' && t.target_value === feederFilter)
    const municipalityMatch =
      municipalityFilter === 'all' ||
      a.targets.some(
        (t) => t.scope_type === 'municipality' && t.target_value === municipalityFilter
      )
    const barangayMatch =
      barangayFilter === 'all' ||
      a.targets.some((t) => t.scope_type === 'barangay' && t.target_value === barangayFilter)
    const cooperativeScopeMatch =
      cooperativeScopeFilter === 'all' ||
      a.targets.some((t) => t.scope_type === 'entire_cooperative')
    const searchMatch =
      !term ||
      [
        a.title,
        a.description,
        ...a.targets.map((t) =>
          t.scope_type === 'entire_cooperative' ? 'Entire Cooperative' : t.target_value
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    return (
      statusMatch &&
      monthMatch &&
      feederMatch &&
      municipalityMatch &&
      barangayMatch &&
      cooperativeScopeMatch &&
      searchMatch
    )
  })

  const pg = usePagination(filtered)

  const filters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (value) => {
        setStatusFilter(value)
        pg.setPage(1)
      },
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      key: 'month',
      label: 'Month',
      value: monthFilter,
      onChange: (value) => {
        setMonthFilter(value)
        pg.setPage(1)
      },
      options: [
        { value: 'all', label: 'All Months' },
        ...monthOptions,
      ],
    },
    {
      key: 'cooperative-scope',
      label: 'Target Scope',
      value: cooperativeScopeFilter,
      onChange: (value) => {
        setCooperativeScopeFilter(value)
        pg.setPage(1)
      },
      options: [
        { value: 'all', label: 'All Target Scopes' },
        { value: 'entire_cooperative', label: 'Entire Cooperative' },
      ],
    },
    {
      key: 'feeder',
      label: 'Feeder',
      value: feederFilter,
      onChange: (value) => {
        setFeederFilter(value)
        pg.setPage(1)
      },
      options: [
        { value: 'all', label: 'All Feeders' },
        ...feederOptions.map((feeder) => ({ value: feeder, label: feeder })),
      ],
    },
    {
      key: 'municipality',
      label: 'Municipality',
      value: municipalityFilter,
      onChange: (value) => {
        setMunicipalityFilter(value)
        pg.setPage(1)
      },
      options: [
        { value: 'all', label: 'All Municipalities' },
        ...municipalityOptions.map((municipality) => ({
          value: municipality,
          label: municipality,
        })),
      ],
    },
    {
      key: 'barangay',
      label: 'Barangay',
      value: barangayFilter,
      onChange: (value) => {
        setBarangayFilter(value)
        pg.setPage(1)
      },
      options: [
        { value: 'all', label: 'All Barangays' },
        ...barangayOptions.map((barangay) => ({ value: barangay, label: barangay })),
      ],
    },
  ]

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

      <FilterBar className="flex flex-wrap items-center gap-3">
        <SearchInput
          className="flex-1 min-w-[200px]"
          value={searchText}
          onChange={(v) => {
            setSearchText(v)
            pg.setPage(1)
          }}
          placeholder="Search advisory title, description, or target scope…"
        />
        <FilterMenu filters={filters} />
        <Button
          variant="plain"
          dim={false}
          className="inline-flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setShowArchived(!showArchived)
            setStatusFilter('all')
            setMonthFilter('all')
            setFeederFilter('all')
            setMunicipalityFilter('all')
            setBarangayFilter('all')
            setCooperativeScopeFilter('all')
            setSearchText('')
            pg.setPage(1)
          }}
        >
          <ArchiveIcon />
          {showArchived ? 'Back to Advisories' : 'View Archive'}
        </Button>
        <ButtonLink
          href="/supervisor/service-areas"
          variant="plain"
          dim={false}
          className="inline-flex items-center gap-2 whitespace-nowrap"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M3 21h18" />
            <path d="M5 21V5l7-3 7 3v16" />
            <path d="M9 9h1" />
            <path d="M14 9h1" />
            <path d="M9 13h1" />
            <path d="M14 13h1" />
            <path d="M9 21v-4h6v4" />
          </svg>
          Manage Service Areas
        </ButtonLink>
        {!showArchived && (
          <Button
            dim={false}
            className="whitespace-nowrap"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Advisory
          </Button>
        )}
        <FilterChips filters={filters} />
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