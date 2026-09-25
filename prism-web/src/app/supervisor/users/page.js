'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/ui/Pagination'
import CreateLinemanModal from '@/components/users/CreateLinemanModal'
import LinemanDetailsModal from '@/components/users/LinemanDetailsModal'
import ConsumerDetailsModal from '@/components/users/ConsumerDetailsModal'
import ManageAreaOfficesModal from '@/components/users/ManageAreaOfficesModal'
import BillingRequestsTab from '@/components/users/BillingRequestsTab'
import BillingRequestDetailsModal from '@/components/users/BillingRequestDetailsModal'
import LinemanRow from '@/components/users/LinemanRow'
import ConsumerRow from '@/components/users/ConsumerRow'

const PAGE_SIZE = 10

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('lineman')
  const [cooperativeId, setCooperativeId] = useState(null)
  const [areaOffices, setAreaOffices] = useState([])

  const [linemen, setLinemen] = useState([])
  const [consumers, setConsumers] = useState([])
  const [billingRequests, setBillingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [areaFilter, setAreaFilter] = useState('All Area')
  const [sortOrder, setSortOrder] = useState('Name (A-Z)')
  const [billingStatusFilter, setBillingStatusFilter] = useState('all')

  const [linemanPage, setLinemanPage] = useState(1)
  const [consumerPage, setConsumerPage] = useState(1)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLineman, setSelectedLineman] = useState(null)
  const [selectedConsumer, setSelectedConsumer] = useState(null)
  const [selectedBillingRequest, setSelectedBillingRequest] = useState(null)
  const [showManageAreas, setShowManageAreas] = useState(false)

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
    setCooperativeId(coopId)

    const { data: coop } = await supabase
      .from('cooperatives')
      .select('area_offices')
      .eq('id', coopId)
      .single()

    setAreaOffices(coop?.area_offices || [])

    // ---- Lineman accounts ----
    const { data: linemanUsers, error: linemanError } = await supabase
      .from('users')
      .select('*')
      .eq('cooperative_id', coopId)
      .eq('user_type', 'lineman')
      .order('first_name', { ascending: true })

    if (linemanError) setError(linemanError.message)

    const linemanIds = (linemanUsers || []).map((u) => u.id)
    let linemanDetails = []
    if (linemanIds.length > 0) {
      const { data } = await supabase
        .from('lineman')
        .select('*')
        .in('profile_id', linemanIds)
      linemanDetails = data || []
    }

    const mergedLinemen = (linemanUsers || []).map((u) => ({
      ...u,
      ...linemanDetails.find((l) => l.profile_id === u.id),
    }))
    setLinemen(mergedLinemen)

    // ---- Consumer accounts ----
    const { data: consumerUsers, error: consumerUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('cooperative_id', coopId)
      .eq('user_type', 'consumer')
      .order('first_name', { ascending: true })

    if (consumerUsersError) setError(consumerUsersError.message)

    const consumerIds = (consumerUsers || []).map((u) => u.id)
    let consumerDetails = []
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from('consumer')
        .select('*')
        .in('profile_id', consumerIds)
      consumerDetails = data || []
    }

    const mergedConsumers = (consumerUsers || []).map((u) => ({
      ...u,
      ...consumerDetails.find((c) => c.profile_id === u.id),
    }))
    setConsumers(mergedConsumers)

    // ---- Billing linkage requests ----
    const { data: billingData, error: billingError } = await supabase
      .from('consumer_bill_links')
      .select('*')
      .order('request_at', { ascending: false })

    if (billingError) setError(billingError.message)

    const billingConsumerIds = (billingData || []).map((r) => r.consumer_id)
    let billingConsumerNames = []
    if (billingConsumerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', billingConsumerIds)
      billingConsumerNames = data || []
    }

    const mergedBilling = (billingData || []).map((r) => ({
      ...r,
      consumerName: billingConsumerNames.find((u) => u.id === r.consumer_id),
    }))
    setBillingRequests(mergedBilling)

    setLoading(false)
  }

  async function handleToggleActive(userId, currentlyActive) {
    const supabase = createClient()
    await supabase
      .from('users')
      .update({ is_active: !currentlyActive })
      .eq('id', userId)
    await loadEverything()
    setSelectedLineman(null)
    setSelectedConsumer(null)
  }

    const filteredLinemen = linemen
    .filter((l) => areaFilter === 'All Area' || l.assigned_area_office === areaFilter)
    .sort((a, b) =>
      sortOrder === 'Name (A-Z)'
        ? a.first_name.localeCompare(b.first_name)
        : b.first_name.localeCompare(a.first_name)
    )

  const linemanTotalPages = Math.max(1, Math.ceil(filteredLinemen.length / PAGE_SIZE))
  const paginatedLinemen = filteredLinemen.slice(
    (linemanPage - 1) * PAGE_SIZE,
    linemanPage * PAGE_SIZE
  )

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('lineman')}
          className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'lineman'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Personnel (Lineman)
        </button>
        <button
          onClick={() => setActiveTab('consumer')}
          className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'consumer'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Consumer Accounts
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'billing'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Billing Requests
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {activeTab === 'lineman' ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900">Lineman Accounts</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Manage field personnel accounts under your cooperative.
          </p>

          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 tracking-wide">
                  AREA
                </span>
                <select
                  value={areaFilter}
                  onChange={(e) => {
                    setAreaFilter(e.target.value)
                    setLinemanPage(1)
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                >
                  <option>All Area</option>
                  {areaOffices.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 tracking-wide">
                  SORT
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value)
                    setLinemanPage(1)
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                >
                  <option>Name (A-Z)</option>
                  <option>Name (Z-A)</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              + Create Lineman Account
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Assigned Area Office</th>
                  <th className="px-5 py-3 font-semibold">Contact Number</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && filteredLinemen.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      No lineman accounts yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedLinemen.map((l) => (
                    <LinemanRow key={l.id} lineman={l} onSelect={setSelectedLineman} />
                  ))}
              </tbody>
            </table>
            {!loading && (
              <Pagination
                page={linemanPage}
                totalPages={linemanTotalPages}
                totalCount={filteredLinemen.length}
                pageSize={PAGE_SIZE}
                onPageChange={setLinemanPage}
              />
            )}
          </div>
        </>
      ) : activeTab === 'consumer' ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900">Consumer Accounts</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            View and manage consumer accounts under your cooperative.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Contact Number</th>
                  <th className="px-5 py-3 font-semibold">Zone</th>
                  <th className="px-5 py-3 font-semibold">Barangay</th>
                  <th className="px-5 py-3 font-semibold">Municipality</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && consumers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                      No consumer accounts yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  consumers
                    .slice((consumerPage - 1) * PAGE_SIZE, consumerPage * PAGE_SIZE)
                    .map((c) => (
                      <ConsumerRow key={c.id} consumer={c} onSelect={setSelectedConsumer} />
                    ))}
              </tbody>
            </table>
            {!loading && (
              <Pagination
                page={consumerPage}
                totalPages={Math.max(1, Math.ceil(consumers.length / PAGE_SIZE))}
                totalCount={consumers.length}
                pageSize={PAGE_SIZE}
                onPageChange={setConsumerPage}
              />
            )}
          </div>
        </>
      ) : (
        <BillingRequestsTab
          billingRequests={billingRequests}
          statusFilter={billingStatusFilter}
          onFilterChange={setBillingStatusFilter}
          onSelectRequest={setSelectedBillingRequest}
        />
      )}

      {showCreateModal && (
        <CreateLinemanModal
          cooperativeId={cooperativeId}
          areaOffices={areaOffices}
          onManageAreas={() => setShowManageAreas(true)}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            loadEverything()
          }}
        />
      )}

      {selectedLineman && (
        <LinemanDetailsModal
          lineman={selectedLineman}
          areaOffices={areaOffices}
          onClose={() => setSelectedLineman(null)}
          onToggleActive={handleToggleActive}
          onSaved={() => {
            setSelectedLineman(null)
            loadEverything()
          }}
        />
      )}

      {selectedConsumer && (
        <ConsumerDetailsModal
          consumer={selectedConsumer}
          onClose={() => setSelectedConsumer(null)}
          onToggleActive={handleToggleActive}
        />
      )}

      {selectedBillingRequest && (
        <BillingRequestDetailsModal
          request={selectedBillingRequest}
          onClose={() => setSelectedBillingRequest(null)}
          onDecided={() => {
            setSelectedBillingRequest(null)
            loadEverything()
          }}
        />
      )}

      {showManageAreas && (
        <ManageAreaOfficesModal
          cooperativeId={cooperativeId}
          areaOffices={areaOffices}
          onClose={() => setShowManageAreas(false)}
          onUpdated={(newList) => setAreaOffices(newList)}
        />
      )}
    </div>
  )
}