'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ServiceAreaFormModal from '@/components/service-areas/ServiceAreaFormModal'
import ServiceAreaRow from '@/components/service-areas/ServiceAreaRow'
import BackToAdvisoriesLink from '@/components/service-areas/BackToAdvisoriesLink'
import ManageAreaOfficesModal from '@/components/users/ManageAreaOfficesModal'

const PAGE_SIZE = 10

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
  const [page, setPage] = useState(1)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [deletingArea, setDeletingArea] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showManageAreaOffices, setShowManageAreaOffices] = useState(false)

  useEffect(() => {
    loadServiceAreas()
  }, [])

  async function loadServiceAreas() {
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

    const { data: coop } = await supabase
      .from('cooperative_settings')
      .select('area_offices')
      .eq('cooperative_id', myRow.cooperative_id)
      .single()

    setAreaOffices(coop?.area_offices || [])

    const { data, error: fetchError } = await supabase
      .from('service_areas')
      .select('*')
      .eq('cooperative_id', myRow.cooperative_id)
      .order('municipality', { ascending: true })
      .order('barangay', { ascending: true })

    if (fetchError) setError(fetchError.message)
    setServiceAreas(data || [])
    setLoading(false)
  }

  async function handleDeleteConfirmed() {
    setDeleteLoading(true)
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('service_areas')
      .delete()
      .eq('id', deletingArea.id)

    if (deleteError) {
      setError(deleteError.message)
      setDeleteLoading(false)
      return
    }

    setDeleteLoading(false)
    setDeletingArea(null)
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const unassignedCount = serviceAreas.filter((a) => !a.area_office).length

  return (
    <div>
      <BackToAdvisoriesLink withMarginBottom />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Areas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the substations, feeders, barangays, and area offices covered by your cooperative.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            + Add Service Area
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
            Total Areas
          </p>
          <p className="text-2xl font-bold text-blue-700">{serviceAreas.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
            Substations
          </p>
          <p className="text-2xl font-bold text-gray-900">{substationOptions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
            Feeders
          </p>
          <p className="text-2xl font-bold text-gray-900">{feederOptions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
            Area Offices
          </p>
          <p className="text-2xl font-bold text-gray-900">{areaOffices.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
            Unassigned Office
          </p>
          <p className={`text-2xl font-bold ${unassignedCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {unassignedCount}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value)
              setPage(1)
            }}
            placeholder="Search barangay, municipality, substation, feeder, area office…"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 tracking-wide">AREA OFFICE</span>
          <select
            value={areaOfficeFilter}
            onChange={(e) => {
              setAreaOfficeFilter(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option>All Area Offices</option>
            {areaOffices.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 tracking-wide">SUBSTATION</span>
          <select
            value={substationFilter}
            onChange={(e) => {
              setSubstationFilter(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option>All Substations</option>
            {substationOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 tracking-wide">FEEDER</span>
          <select
            value={feederFilter}
            onChange={(e) => {
              setFeederFilter(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option>All Feeders</option>
            {feederOptions.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>

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
              setPage(1)
            }}
            className="text-sm text-blue-700 font-medium whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
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
              <th className="px-5 py-3 font-semibold">Barangay</th>
              <th className="px-5 py-3 font-semibold">Municipality</th>
              <th className="px-5 py-3 font-semibold">Province</th>
              <th className="px-5 py-3 font-semibold">Feeder</th>
              <th className="px-5 py-3 font-semibold">Substation</th>
              <th className="px-5 py-3 font-semibold">Area Office</th>
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
                  No service areas match this view.
                </td>
              </tr>
            )}

            {!loading &&
              paginated.map((area) => (
                <ServiceAreaRow
                  key={area.id}
                  area={area}
                  onEdit={setEditingArea}
                  onDelete={setDeletingArea}
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
          <p className="text-sm text-gray-700 mb-6">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{deletingArea.barangay}</span>,{' '}
            {deletingArea.municipality}? This action cannot be undone, and it may
            affect existing Power Advisories referencing this area, and will block
            future consumer registrations/edits for this barangay until it's re-added.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingArea(null)}
              disabled={deleteLoading}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              disabled={deleteLoading}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
            >
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
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