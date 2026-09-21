'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import StatusDot from '@/components/ui/StatusDot'
import Pagination from '@/components/ui/Pagination'

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
                    <tr key={l.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {l.first_name} {l.last_name}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {l.assigned_area_office || '—'}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{l.phone_number}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedLineman(l)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
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
                    <tr key={c.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {c.first_name} {c.last_name}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{c.phone_number}</td>
                      <td className="px-5 py-4 text-gray-600">{c.zone || '—'}</td>
                      <td className="px-5 py-4 text-gray-600">{c.barangay || '—'}</td>
                      <td className="px-5 py-4 text-gray-600">
                        {c.municipality || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedConsumer(c)}
                          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
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

// ---------- Create Lineman modal ----------
function CreateLinemanModal({ cooperativeId, areaOffices, onManageAreas, onClose, onCreated }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyIdNumber: '',
    email: '',
    contactNumber: '',
    assignedAreaOffice: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/supervisor/create-lineman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cooperativeId, ...form }),
    })
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Failed to create account.')
      setLoading(false)
      return
    }

    onCreated()
  }

  return (
    <Modal title="Create Lineman Account" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormSection title="Lineman Identity">
          <FormField
            label="Full Name"
            name="firstName"
            required
            placeholder="First name"
            value={form.firstName}
            onChange={handleChange}
          />
          <FormField
            label="Last Name"
            name="lastName"
            required
            placeholder="Last name"
            value={form.lastName}
            onChange={handleChange}
          />
          <FormField
            label="Company ID Number"
            name="companyIdNumber"
            placeholder="UT-XXXX-2024"
            value={form.companyIdNumber}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection title="Connectivity">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="tech@utilitypro.com"
            value={form.email}
            onChange={handleChange}
          />
          <FormField
            label="Contact Number"
            name="contactNumber"
            required
            placeholder="+63 900 000 0000"
            value={form.contactNumber}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection title="System Access">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Assigned Area Office
            </label>
            <select
              name="assignedAreaOffice"
              required
              value={form.assignedAreaOffice}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
            >
              <option value="">Select an area</option>
              {areaOffices.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onManageAreas}
              className="text-xs text-blue-700 font-medium mt-1"
            >
              Manage area offices
            </button>
          </div>
          <FormField
            label="Initial Password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
          />
        </FormSection>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---------- Lineman Details modal ----------
function LinemanDetailsModal({ lineman, areaOffices, onClose, onToggleActive, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    first_name: lineman.first_name,
    last_name: lineman.last_name,
    email: lineman.email,
    phone_number: lineman.phone_number,
    assigned_area_office: lineman.assigned_area_office || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { first_name, last_name, email, phone_number, assigned_area_office } = form

    const { error: userError } = await supabase
      .from('users')
      .update({ first_name, last_name, email, phone_number })
      .eq('id', lineman.id)

    if (userError) {
      setError(userError.message)
      setSaving(false)
      return
    }

    const { error: linemanError } = await supabase
      .from('lineman')
      .update({ assigned_area_office })
      .eq('profile_id', lineman.id)

    if (linemanError) {
      setError(linemanError.message)
      setSaving(false)
      return
    }

    onSaved()
  }

  return (
    <Modal title="Lineman Details" onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <StatusDot isActive={lineman.is_active} />
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      <FormSection title="Lineman Identity">
        <FormField
          label="First Name"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          disabled={!editing}
        />
        <FormField
          label="Last Name"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          disabled={!editing}
        />
        <FormField
          label="Company ID Number"
          value={lineman.company_id_number || '—'}
          disabled
        />
      </FormSection>

      <FormSection title="Connectivity">
        <FormField
          label="Email Address"
          name="email"
          value={form.email}
          onChange={handleChange}
          disabled={!editing}
        />
        <FormField
          label="Contact Number"
          name="phone_number"
          value={form.phone_number}
          onChange={handleChange}
          disabled={!editing}
        />
      </FormSection>

      <FormSection title="System Access">
        {editing ? (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Assigned Area Office
            </label>
            <select
              name="assigned_area_office"
              value={form.assigned_area_office}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
            >
              <option value="">Select an area</option>
              {areaOffices.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
        ) : (
          <FormField
            label="Assigned Area Office"
            value={lineman.assigned_area_office || '—'}
            disabled
          />
        )}
      </FormSection>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {editing ? (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => onToggleActive(lineman.id, lineman.is_active)}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            lineman.is_active
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-blue-700 hover:bg-blue-800 text-white'
          }`}
        >
          {lineman.is_active ? 'Deactivate Account' : 'Reactivate Account'}
        </button>
      )}
    </Modal>
  )
}

// ---------- Consumer Details modal ----------
function ConsumerDetailsModal({ consumer, onClose, onToggleActive }) {
  return (
    <Modal title="Consumer Details" onClose={onClose}>
      <div className="mb-4">
        <StatusDot isActive={consumer.is_active} />
      </div>

      <FormSection title="Consumer Identity">
        <FormField
          label="Full Name"
          value={`${consumer.first_name} ${consumer.last_name}`}
          disabled
        />
        <FormField label="Contact Number" value={consumer.phone_number || '—'} disabled />
      </FormSection>

      <FormSection title="Location">
        <FormField label="Zone" value={consumer.zone || '—'} disabled />
        <FormField label="Barangay" value={consumer.barangay || '—'} disabled />
        <FormField label="Municipality" value={consumer.municipality || '—'} disabled />
      </FormSection>

      <button
        onClick={() => onToggleActive(consumer.id, consumer.is_active)}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          consumer.is_active
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : 'bg-blue-700 hover:bg-blue-800 text-white'
        }`}
      >
        {consumer.is_active ? 'Deactivate Account' : 'Reactivate Account'}
      </button>
    </Modal>
  )
}

// ---------- Manage Area Offices modal ----------
function ManageAreaOfficesModal({ cooperativeId, areaOffices, onClose, onUpdated }) {
  const [list, setList] = useState(areaOffices)
  const [newArea, setNewArea] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function persist(updatedList) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('cooperatives')
      .update({ area_offices: updatedList })
      .eq('id', cooperativeId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setList(updatedList)
    onUpdated(updatedList)
    setSaving(false)
  }

  function handleAdd() {
    const trimmed = newArea.trim()
    if (!trimmed || list.includes(trimmed)) return
    persist([...list, trimmed])
    setNewArea('')
  }

  function handleDelete(area) {
    persist(list.filter((a) => a !== area))
  }

  return (
    <Modal title="Manage Area Offices" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {list.length === 0 && (
          <p className="text-sm text-gray-500">No area offices yet.</p>
        )}
        {list.map((area) => (
          <div
            key={area}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200"
          >
            <span className="text-sm text-gray-900">{area}</span>
            <button
              onClick={() => handleDelete(area)}
              disabled={saving}
              className="text-xs font-semibold text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={newArea}
          onChange={(e) => setNewArea(e.target.value)}
          placeholder="New area office name"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
        >
          Add
        </button>
      </div>
    </Modal>
  )
}

// ---------- Billing Requests tab content ----------
function BillingRequestsTab({ billingRequests, statusFilter, onFilterChange, onSelectRequest }) {
  const [billingPage, setBillingPage] = useState(1)
  const counts = {
    all: billingRequests.length,
    pending: billingRequests.filter((r) => r.status === 'pending').length,
    approved: billingRequests.filter((r) => r.status === 'approved').length,
    rejected: billingRequests.filter((r) => r.status === 'rejected').length,
  }

  const filtered =
    statusFilter === 'all'
      ? billingRequests
      : billingRequests.filter((r) => r.status === statusFilter)

  const billingTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedBilling = filtered.slice(
    (billingPage - 1) * PAGE_SIZE,
    billingPage * PAGE_SIZE
  )

  const cards = [
    { key: 'all', label: 'All Requests', color: 'text-blue-700' },
    { key: 'pending', label: 'Pending Approval', color: 'text-amber-600' },
    { key: 'approved', label: 'Approved', color: 'text-green-600' },
    { key: 'rejected', label: 'Rejected', color: 'text-gray-900' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Billing Linkage Requests</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Every billing linkage request submitted on the platform. Click a status below to filter.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => {
          const isActive = statusFilter === c.key
          return (
            <button
              key={c.key}
              onClick={() => {
                onFilterChange(c.key)
                setBillingPage(1)
              }}
              className={`text-left bg-white rounded-xl border p-4 transition-all ${
                isActive ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
                {c.label}
              </p>
              <p className={`text-2xl font-bold ${c.color}`}>{counts[c.key]}</p>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Consumer Name</th>
              <th className="px-5 py-3 font-semibold">Account #</th>
              <th className="px-5 py-3 font-semibold">Account Type</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Request Date</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No requests match this view.
                </td>
              </tr>
            )}
            {paginatedBilling.map((r) => (
              <tr key={r.link_id} className="border-b border-gray-100 last:border-0">
                <td className="px-5 py-4 font-medium text-gray-900">
                  {r.consumerName?.first_name} {r.consumerName?.last_name}
                </td>
                <td className="px-5 py-4 text-gray-600">{r.account_number}</td>
                <td className="px-5 py-4 text-gray-600 capitalize">{r.account_type}</td>
                <td className="px-5 py-4">
                  <BillingStatusPill status={r.status} />
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {new Date(r.request_at).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => onSelectRequest(r)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      r.status === 'pending'
                        ? 'bg-blue-700 hover:bg-blue-800 text-white'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                    }`}
                  >
                    {r.status === 'pending' ? 'Review' : 'Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={billingPage}
          totalPages={billingTotalPages}
          totalCount={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setBillingPage}
        />
      </div>
    </div>
  )
}

function BillingStatusPill({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${styles[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status === 'pending' ? 'Pending Verification' : status}
    </span>
  )
}

// ---------- Billing Request Details modal ----------
function BillingRequestDetailsModal({ request, onClose, onDecided }) {
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApprove() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('consumer_bill_links')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('link_id', request.link_id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setShowSuccess(true)
  }

  async function handleConfirmDecline() {
    if (!declineReason.trim()) {
      setError('Please provide a reason before declining.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('consumer_bill_links')
      .update({
        status: 'rejected',
        rejection_reason: declineReason.trim(),
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('link_id', request.link_id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    onDecided()
  }

  if (showSuccess) {
    return (
      <Modal title="" onClose={onDecided}>
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Linkage Approved Successfully!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The billing account <span className="font-semibold">{request.account_number}</span>{' '}
            has been successfully linked to the consumer's account.
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-3 gap-2 text-left mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Account Name</p>
              <p className="text-sm font-semibold text-gray-900">{request.account_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Account Number</p>
              <p className="text-sm font-semibold text-gray-900">{request.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Account Type</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {request.account_type}
              </p>
            </div>
          </div>
          <button
            onClick={onDecided}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            DONE
          </button>
        </div>
      </Modal>
    )
  }

  if (showDecline) {
    return (
      <Modal title="Decline Billing Request" onClose={onClose}>
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
          <p className="text-xs font-bold text-red-700 uppercase mb-2">
            Declining Request For
          </p>
          <p className="text-sm text-gray-900 font-semibold">
            Account Name: {request.account_name}
          </p>
          <p className="text-sm text-gray-900 font-semibold">
            Account Number: {request.account_number}
          </p>
        </div>

        <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
          REASON / REMARKS
        </label>
        <textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          rows={4}
          placeholder="Provide specific details for the consumer regarding this decline..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDecline(false)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDecline}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Confirm Decline'}
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Billing Request Details" onClose={onClose}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold">Consumer Name</p>
          <p className="text-base font-semibold text-gray-900">
            {request.consumerName?.first_name} {request.consumerName?.last_name}
          </p>
        </div>
        <BillingStatusPill status={request.status} />
      </div>

      <FormSection title="Requestor Information">
        <FormField label="Account Name" value={request.account_name} disabled />
        <FormField label="Account Type" value={request.account_type} disabled />
        <FormField
          label="Date Requested"
          value={new Date(request.request_at).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          disabled
        />
        <FormField label="Account Number" value={request.account_number} disabled />
      </FormSection>

      {request.status === 'rejected' && request.rejection_reason && (
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-semibold text-gray-700">Rejection Reason:</span>{' '}
          {request.rejection_reason}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {request.status === 'pending' && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDecline(true)}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50"
          >
            Decline
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Approving…' : 'Approve Linkage'}
          </button>
        </div>
      )}
    </Modal>
  )
}