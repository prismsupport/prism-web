'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { toast } from '@/lib/toast'
import usePagination from '@/lib/usePagination'
import { buildServiceAreaOptions, filterServiceAreas } from '@/lib/serviceAreas/serviceAreaHelpers'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import ServiceAreaFormModal from '@/components/service-areas/ServiceAreaFormModal'
import ServiceAreaRow from '@/components/service-areas/ServiceAreaRow'
import ServiceAreaStatCards from '@/components/service-areas/ServiceAreaStatCards'
import ServiceAreaToolbar from '@/components/service-areas/ServiceAreaToolbar'
import ArchiveServiceAreaModal from '@/components/service-areas/ArchiveServiceAreaModal'
import ManageAreaOfficesModal from '@/components/users/ManageAreaOfficesModal'

const COLUMNS = [
  'Barangay',
  'Municipality',
  'Province',
  'Feeder',
  'Substation',
  'Area Office',
  'Actions',
].map((label) => ({ label, className: 'text-center' }))

export default function ServiceAreasPage() {
  const [cooperativeId, setCooperativeId] = useState(null)
  const [areaOffices, setAreaOffices] = useState([])
  const [serviceAreas, setServiceAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [substationFilter, setSubstationFilter] = useState('All Substations')
  const [feederFilter, setFeederFilter] = useState('All Feeders')
  const [areaOfficeFilter, setAreaOfficeFilter] = useState('All Area Offices')
  const [provinceFilter, setProvinceFilter] = useState('All Provinces')
  const [municipalityFilter, setMunicipalityFilter] = useState('All Municipalities')
  const [searchText, setSearchText] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [deletingArea, setDeletingArea] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [impact, setImpact] = useState(null)
  const [impactLoading, setImpactLoading] = useState(false)
  const [impactError, setImpactError] = useState('')
  const [showManageAreaOffices, setShowManageAreaOffices] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    loadServiceAreas()
  }, [])

  async function loadServiceAreas() {
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

    const { data: coop } = await supabase
      .from('cooperative_settings')
      .select('area_offices')
      .eq('cooperative_id', coopId)
      .single()

    setAreaOffices(coop?.area_offices || [])

    const { data, error: fetchError } = await supabase
      .from('service_areas')
      .select('*')
      .eq('cooperative_id', coopId)
      .order('municipality', { ascending: true })
      .order('barangay', { ascending: true })

    if (fetchError) setError(fetchError.message)
    setServiceAreas(data || [])
    setLoading(false)
  }

  async function openDelete(area) {
    setDeletingArea(area)
    setImpact(null)
    setImpactError('')
    setImpactLoading(true)

    const supabase = createClient()
    const { data, error: rpcError } = await supabase
      .rpc('get_service_area_impact', { p_service_area_id: area.id })
      .single()

    if (rpcError) setImpactError(rpcError.message)
    else setImpact(data)
    setImpactLoading(false)
  }

  // Archive = hide it from use, but keep the area in the database.
  async function handleArchiveConfirmed() {
    setDeleteLoading(true)
    const supabase = createClient()
    const { error: archiveError } = await supabase
      .from('service_areas')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', deletingArea.id)

    if (archiveError) {
      toast.error(archiveError.message)
      setError(archiveError.message)
      setDeleteLoading(false)
      return
    }

    setDeleteLoading(false)
    setDeletingArea(null)
    toast.success('Service area archived')
    loadServiceAreas()
  }

  async function handleRestore(area) {
    const supabase = createClient()
    const { error: restoreError } = await supabase
      .from('service_areas')
      .update({ archived_at: null })
      .eq('id', area.id)

    if (restoreError) {
      toast.error(restoreError.message)
      return
    }

    toast.success('Service area restored')
    loadServiceAreas()
  }

  // Normal view shows only active areas, the archive view only archived ones
  const activeAreas = serviceAreas.filter((a) => !a.archived_at)
  const visibleAreas = serviceAreas.filter((a) =>
    showArchived ? a.archived_at : !a.archived_at
  )

  const { substations, feeders, provinces, municipalities } = buildServiceAreaOptions(visibleAreas)

  const filtered = filterServiceAreas(
    visibleAreas,
    {
      areaOffice: areaOfficeFilter,
      substation: substationFilter,
      feeder: feederFilter,
      province: provinceFilter,
      municipality: municipalityFilter,
    },
    searchText
  )

  const pg = usePagination(filtered)

  const unassignedCount = visibleAreas.filter((a) => !a.area_office).length

  // Wraps a filter setter so changing a filter returns to page 1
  const withReset = (setter) => (value) => {
    setter(value)
    pg.setPage(1)
  }

  const filters = [
    {
      key: 'areaOffice',
      label: 'Area Office',
      value: areaOfficeFilter,
      defaultValue: 'All Area Offices',
      onChange: withReset(setAreaOfficeFilter),
      options: [
        { value: 'All Area Offices', label: 'All Area Offices' },
        ...areaOffices.map((a) => ({ value: a, label: a })),
      ],
    },
    {
      key: 'substation',
      label: 'Substation',
      value: substationFilter,
      defaultValue: 'All Substations',
      onChange: withReset(setSubstationFilter),
      options: [
        { value: 'All Substations', label: 'All Substations' },
        ...substations.map((s) => ({ value: s, label: s })),
      ],
    },
    {
      key: 'feeder',
      label: 'Feeder',
      value: feederFilter,
      defaultValue: 'All Feeders',
      onChange: withReset(setFeederFilter),
      options: [
        { value: 'All Feeders', label: 'All Feeders' },
        ...feeders.map((f) => ({ value: f, label: f })),
      ],
    },
    {
      key: 'province',
      label: 'Province',
      value: provinceFilter,
      defaultValue: 'All Provinces',
      onChange: withReset(setProvinceFilter),
      options: [
        { value: 'All Provinces', label: 'All Provinces' },
        ...provinces.map((p) => ({ value: p, label: p })),
      ],
    },
    {
      key: 'municipality',
      label: 'Municipality',
      value: municipalityFilter,
      defaultValue: 'All Municipalities',
      onChange: withReset(setMunicipalityFilter),
      options: [
        { value: 'All Municipalities', label: 'All Municipalities' },
        ...municipalities.map((m) => ({ value: m, label: m })),
      ],
    },
  ]

  function handleToggleArchived() {
    setShowArchived(!showArchived)
    setSubstationFilter('All Substations')
    setFeederFilter('All Feeders')
    setAreaOfficeFilter('All Area Offices')
    setProvinceFilter('All Provinces')
    setMunicipalityFilter('All Municipalities')
    setSearchText('')
    pg.setPage(1)
  }

  return (
    <div>
      <PageHeader
        title={showArchived ? 'Archived Service Areas' : 'Service Areas'}
        description={
          showArchived
            ? 'Archived areas are no longer used for feeder matching, dispatch, or advisories. Restore one to use it again.'
            : 'Manage the substations, feeders, barangays, and area offices covered by your cooperative.'
        }
      />

      <ServiceAreaStatCards
        showArchived={showArchived}
        areaCount={showArchived ? visibleAreas.length : activeAreas.length}
        substationCount={substations.length}
        feederCount={feeders.length}
        areaOfficeCount={areaOffices.length}
        unassignedCount={unassignedCount}
      />

      <ServiceAreaToolbar
        searchText={searchText}
        onSearchChange={withReset(setSearchText)}
        filters={filters}
        showArchived={showArchived}
        onToggleArchived={handleToggleArchived}
        onManageAreaOffices={() => setShowManageAreaOffices(true)}
        onAdd={() => setShowCreateModal(true)}
      />

      <Alert>{error}</Alert>

      <DataTable
        columns={COLUMNS}
        loading={loading}
        isEmpty={pg.pageItems.length === 0}
        empty={showArchived ? 'No archived service areas.' : 'No service areas match this view.'}
        footer={!loading && <Pagination {...pg.paginationProps} />}
      >
        {pg.pageItems.map((area) => (
          <ServiceAreaRow
            key={area.id}
            area={area}
            archived={showArchived}
            onEdit={setEditingArea}
            onDelete={openDelete}
            onRestore={handleRestore}
          />
        ))}
      </DataTable>

      {(showCreateModal || editingArea) && (
        <ServiceAreaFormModal
          cooperativeId={cooperativeId}
          areaOffices={areaOffices}
          onManageAreaOffices={() => setShowManageAreaOffices(true)}
          area={editingArea}
          onClose={() => {
            setShowCreateModal(false)
            setEditingArea(null)
          }}
          onSaved={() => {
            setShowCreateModal(false)
            setEditingArea(null)
            loadServiceAreas()
          }}
        />
      )}

      {deletingArea && (
        <ArchiveServiceAreaModal
          area={deletingArea}
          impact={impact}
          impactLoading={impactLoading}
          impactError={impactError}
          loading={deleteLoading}
          onConfirm={handleArchiveConfirmed}
          onClose={() => setDeletingArea(null)}
        />
      )}

      {showManageAreaOffices && (
        <ManageAreaOfficesModal
          cooperativeId={cooperativeId}
          areaOffices={areaOffices}
          onClose={() => setShowManageAreaOffices(false)}
          onUpdated={(newList) => setAreaOffices(newList)}
        />
      )}
    </div>
  )
}