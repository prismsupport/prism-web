'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { toast } from '@/lib/toast'
import usePagination from '@/lib/usePagination'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import StatCard, { StatCardGrid } from '@/components/ui/StatCard'
import ServiceAreaFormModal from '@/components/service-areas/ServiceAreaFormModal'
import ServiceAreaRow from '@/components/service-areas/ServiceAreaRow'
import BackToAdvisoriesLink from '@/components/service-areas/BackToAdvisoriesLink'
import ManageAreaOfficesModal from '@/components/users/ManageAreaOfficesModal'

const COLUMNS = ['Barangay', 'Municipality', 'Province', 'Feeder', 'Substation', 'Area Office', 'Actions']

export default function ServiceAreasPage() {
  const [cooperativeId, setCooperativeId] = useState(null)
  const [areaOffices, setAreaOffices] = useState([])
  const [serviceAreas, setServiceAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [substationFilter, setSubstationFilter] = useState('All Substations')
  const [feederFilter, setFeederFilter] = useState('All Feeders')
  const [areaOfficeFilter, setAreaOfficeFilter] = useState('All Area Offices')
  const [searchText, setSearchText] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [deletingArea, setDeletingArea] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [impact, setImpact] = useState(null)
  const [impactLoading, setImpactLoading] = useState(false)
  const [impactError, setImpactError] = useState('')
  const [showManageAreaOffices, setShowManageAreaOffices] = useState(false)

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

  async function handleDeleteConfirmed() {
    setDeleteLoading(true)
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('service_areas')
      .delete()
      .eq('id', deletingArea.id)

    if (deleteError) {
      toast.error(deleteError.message)
      setError(deleteError.message)
      setDeleteLoading(false)
      return
    }

    setDeleteLoading(false)
    setDeletingArea(null)
    toast.success('Service area deleted')
    loadServiceAreas()
  }

  const substationOptions = Array.from(
    new Set(serviceAreas.map((a) => a.substation).filter(Boolean))
  ).sort()

  const feederOptions = Array.from(
    new Set(serviceAreas.map((a) => a.feeder).filter(Boolean))
  ).sort()

  const filtered = serviceAreas.filter((a) => {
    const substationMatch =
      substationFilter === 'All Substations' || a.substation === substationFilter
    const feederMatch = feederFilter === 'All Feeders' || a.feeder === feederFilter
    const areaOfficeMatch =
      areaOfficeFilter === 'All Area Offices' || a.area_office === areaOfficeFilter
    const term = searchText.trim().toLowerCase()
    const searchMatch =
      !term ||
      a.barangay?.toLowerCase().includes(term) ||
      a.municipality?.toLowerCase().includes(term) ||
      a.substation?.toLowerCase().includes(term) ||
      a.feeder?.toLowerCase().includes(term) ||
      a.area_office?.toLowerCase().includes(term)
    return substationMatch && feederMatch && areaOfficeMatch && searchMatch
  })

  const pg = usePagination(filtered)

  const unassignedCount = serviceAreas.filter((a) => !a.area_office).length

  // Wraps a filter setter so changing a filter returns to page 1
  const withReset = (setter) => (value) => {
    setter(value)
    pg.setPage(1)
  }

  return (
    <div>
      <BackToAdvisoriesLink withMarginBottom />

      <PageHeader
        title="Service Areas"
        description="Manage the substations, feeders, barangays, and area offices covered by your cooperative."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="plain"
              dim={false}
              className="whitespace-nowrap"
              onClick={() => setShowManageAreaOffices(true)}
            >
              Manage Area Offices
            </Button>
            <Button dim={false} className="whitespace-nowrap" onClick={() => setShowCreateModal(true)}>
              + Add Service Area
            </Button>
          </div>
        }
      />

      <StatCardGrid columns={5}>
        <StatCard compact label="Total Areas" value={serviceAreas.length} color="text-blue-700" />
        <StatCard compact label="Substations" value={substationOptions.length} />
        <StatCard compact label="Feeders" value={feederOptions.length} />
        <StatCard compact label="Area Offices" value={areaOffices.length} />
        <StatCard
          compact
          label="Unassigned Office"
          value={unassignedCount}
          color={unassignedCount > 0 ? 'text-amber-600' : 'text-gray-900'}
        />
      </StatCardGrid>

      <FilterBar className="flex flex-wrap items-center gap-3">
        <SearchInput
          className="flex-1 min-w-[220px]"
          value={searchText}
          onChange={withReset(setSearchText)}
          placeholder="Search barangay, municipality, substation, feeder, area office…"
        />

        <FilterSelect label="AREA OFFICE" value={areaOfficeFilter} onChange={withReset(setAreaOfficeFilter)}>
          <option>All Area Offices</option>
          {areaOffices.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </FilterSelect>

        <FilterSelect label="SUBSTATION" value={substationFilter} onChange={withReset(setSubstationFilter)}>
          <option>All Substations</option>
          {substationOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </FilterSelect>

        <FilterSelect label="FEEDER" value={feederFilter} onChange={withReset(setFeederFilter)}>
          <option>All Feeders</option>
          {feederOptions.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </FilterSelect>

        {(substationFilter !== 'All Substations' ||
          feederFilter !== 'All Feeders' ||
          areaOfficeFilter !== 'All Area Offices' ||
          searchText) && (
          <button
            onClick={() => {
              setSubstationFilter('All Substations')
              setFeederFilter('All Feeders')
              setAreaOfficeFilter('All Area Offices')
              setSearchText('')
              pg.setPage(1)
            }}
            className="text-sm text-blue-700 font-medium whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </FilterBar>

      <Alert>{error}</Alert>

      <DataTable
        columns={COLUMNS}
        loading={loading}
        isEmpty={pg.pageItems.length === 0}
        empty="No service areas match this view."
        footer={!loading && <Pagination {...pg.paginationProps} />}
      >
        {pg.pageItems.map((area) => (
          <ServiceAreaRow key={area.id} area={area} onEdit={setEditingArea} onDelete={openDelete} />
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
        <Modal title="Delete Service Area" onClose={() => setDeletingArea(null)}>
          <p className="text-sm text-gray-700 mb-4">
            <span className="font-semibold">{deletingArea.barangay}</span>,{' '}
            {deletingArea.municipality}
          </p>

          {impactLoading && (
            <p className="text-sm text-gray-500 mb-6">Checking what depends on this area…</p>
          )}

          {impactError && (
            <Alert className="mb-6">
              Could not check what depends on this area, so it can't be deleted right now. (
              {impactError})
            </Alert>
          )}

          {impact && (
            <>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4 text-sm">
                <div className="flex justify-between px-3 py-2">
                  <span className="text-gray-600">Consumers registered here</span>
                  <span className="font-semibold text-gray-900">{impact.consumer_count}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-gray-600">Current or upcoming advisories aimed here</span>
                  <span className="font-semibold text-gray-900">{impact.advisory_count}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-gray-600">Open reports (not yet resolved)</span>
                  <span className="font-semibold text-gray-900">{impact.open_report_count}</span>
                </div>
              </div>

              {!impact.can_delete ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-6">
                  This area can't be deleted while consumers or current/upcoming advisories depend
                  on it. Deleting it would stop those consumers from saving an address change and
                  leave the advisories pointing at an area that no longer exists.
                </p>
              ) : (
                <p className="text-sm text-gray-700 mb-6">
                  {impact.open_report_count > 0
                    ? `Deleting it removes the Area Office and feeder match for ${impact.open_report_count} open report(s), which changes how linemen and duplicates are ranked for them. `
                    : 'Nothing depends on this area. '}
                  This action cannot be undone.
                </p>
              )}
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" dim={false} onClick={() => setDeletingArea(null)} disabled={deleteLoading}>
              {impact && !impact.can_delete ? 'Close' : 'Cancel'}
            </Button>
            {impact?.can_delete && (
              <Button variant="danger" onClick={handleDeleteConfirmed} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </Button>
            )}
          </div>
        </Modal>
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
