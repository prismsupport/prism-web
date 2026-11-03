'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import usePagination from '@/lib/usePagination'
import Pagination from '@/components/ui/Pagination'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar'
import { FilterMenu, FilterChips } from '@/components/ui/FilterMenu'
import SearchInput from '@/components/ui/SearchInput'
import Tabs from '@/components/ui/Tabs'
import CreateLinemanModal from '@/components/users/CreateLinemanModal'
import LinemanDetailsModal from '@/components/users/LinemanDetailsModal'
import ConsumerDetailsModal from '@/components/users/ConsumerDetailsModal'
import ManageAreaOfficesModal from '@/components/users/ManageAreaOfficesModal'
import CreateSupervisorModal from '@/components/users/CreateSupervisorModal'
import SupervisorDetailsModal from '@/components/users/SupervisorDetailsModal'
import LinemanRow from '@/components/users/LinemanRow'
import ConsumerRow from '@/components/users/ConsumerRow'
import SupervisorRow from '@/components/users/SupervisorRow'
import { toast } from '@/lib/toast'

const TABS = [
  { key: 'lineman', label: 'Personnel (Lineman)' },
  { key: 'consumer', label: 'Consumer Accounts' },
  { key: 'supervisor', label: 'Supervisors' },
]

const LINEMAN_COLUMNS = [
  'Name',
  'Assigned Area Office',
  'Shift',
  'Duty Status',
  'Contact Number',
  'Actions',
]
const CONSUMER_COLUMNS = [
  'Name',
  'Contact Number',
  'Zone',
  'Barangay',
  'Municipality',
  { label: 'Actions', className: 'text-center' },
]
const SUPERVISOR_COLUMNS = [
  'Name',
  { label: 'Access', className: 'text-center' },
  'Contact Number',
  'Actions',
]

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('lineman')
  const [cooperativeId, setCooperativeId] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [areaOffices, setAreaOffices] = useState([])

  const [linemen, setLinemen] = useState([])
  const [dutyById, setDutyById] = useState({})
  const [consumers, setConsumers] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [areaFilter, setAreaFilter] = useState('All Area Offices')
  const [shiftFilter, setShiftFilter] = useState('All Shifts')
  const [sortOrder, setSortOrder] = useState('Name (A-Z)')
  const [consumerSortOrder, setConsumerSortOrder] = useState('Name (A-Z)')
  const [municipalityFilter, setMunicipalityFilter] = useState('All Municipalities')
  const [barangayFilter, setBarangayFilter] = useState('All Barangays')
  const [supervisorSortOrder, setSupervisorSortOrder] = useState('Name (A-Z)')
  const [supervisorAccessFilter, setSupervisorAccessFilter] = useState('All Access')
  const [searchText, setSearchText] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateSupervisorModal, setShowCreateSupervisorModal] = useState(false)
  const [selectedLineman, setSelectedLineman] = useState(null)
  const [selectedConsumer, setSelectedConsumer] = useState(null)
  const [selectedSupervisor, setSelectedSupervisor] = useState(null)
  const [showManageAreas, setShowManageAreas] = useState(false)

  useEffect(() => {
    loadEverything()
  }, [])

  // Keep the live duty badges fresh while the Personnel tab is open
  useEffect(() => {
    if (activeTab !== 'lineman') return
    loadDutyStatus()
    const timer = setInterval(loadDutyStatus, 60000)
    return () => clearInterval(timer)
  }, [activeTab])

  async function loadEverything() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setCurrentUserId(user.id)

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
      .from('cooperative_settings')
      .select('area_offices')
      .eq('cooperative_id', coopId)
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

    // ---- Supervisor accounts ----
    const { data: supervisorUsers, error: supervisorError } = await supabase
      .from('users')
      .select('*')
      .eq('cooperative_id', coopId)
      .eq('user_type', 'supervisor')
      .order('first_name', { ascending: true })

    if (supervisorError) setError(supervisorError.message)

    const supervisorIds = (supervisorUsers || []).map((u) => u.id)
    let supervisorDetails = []
    if (supervisorIds.length > 0) {
      const { data } = await supabase
        .from('supervisor')
        .select('*')
        .in('profile_id', supervisorIds)
      supervisorDetails = data || []
    }

    const mergedSupervisors = (supervisorUsers || [])
      .map((u) => ({
        ...u,
        ...supervisorDetails.find((s) => s.profile_id === u.id),
      }))
      .sort((a, b) => (a.is_owner === b.is_owner ? 0 : a.is_owner ? -1 : 1))

    setSupervisors(mergedSupervisors)

    setLoading(false)
  }

  async function loadDutyStatus() {
    const supabase = createClient()
    const [dutyRes, seenRes] = await Promise.all([
      supabase.rpc('get_lineman_duty_status'),
      supabase.from('lineman').select('profile_id, location_updated_at'),
    ])

    const map = {}
    ;(dutyRes.data || []).forEach((d) => {
      map[d.lineman_id] = { ...d }
    })
    ;(seenRes.data || []).forEach((s) => {
      if (map[s.profile_id]) map[s.profile_id].location_updated_at = s.location_updated_at
    })
    setDutyById(map)
  }

  async function handleToggleActive(userId, currentlyActive) {
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ is_active: !currentlyActive })
      .eq('id', userId)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(currentlyActive ? 'Account deactivated' : 'Account activated')
    await loadEverything()
    setSelectedLineman(null)
    setSelectedConsumer(null)
    setSelectedSupervisor(null)
  }

  const term = searchText.trim().toLowerCase()
  const matches = (...values) =>
    !term ||
    values
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(term)

  const filteredLinemen = linemen
    .filter((l) => areaFilter === 'All Area Offices' || l.assigned_area_office === areaFilter)
    .filter((l) => {
      if (shiftFilter === 'All Shifts') return true
      const shiftName = shiftFilter === 'Morning Duty' ? 'morning' : 'night'
      return (l.schedule || []).some((shift) =>
        shift.name?.toLowerCase().includes(shiftName)
      )
    })
    .filter((l) =>
      matches(
        l.first_name,
        l.last_name,
        `${l.first_name} ${l.last_name}`,
        l.email,
        l.phone_number,
        l.company_id_number,
        l.assigned_area_office
      )
    )
    .sort((a, b) =>
      sortOrder === 'Name (A-Z)'
        ? a.first_name.localeCompare(b.first_name)
        : b.first_name.localeCompare(a.first_name)
    )

  const municipalityOptions = [...new Set(consumers.map((c) => c.municipality).filter(Boolean))].sort()
  const barangayOptions = [...new Set(consumers.map((c) => c.barangay).filter(Boolean))].sort()

  const filteredConsumers = consumers
    .filter(
      (c) =>
        municipalityFilter === 'All Municipalities' || c.municipality === municipalityFilter
    )
    .filter((c) => barangayFilter === 'All Barangays' || c.barangay === barangayFilter)
    .filter((c) =>
      matches(
        `${c.first_name} ${c.last_name}`,
        c.email,
        c.phone_number,
        c.zone,
        c.barangay,
        c.municipality
      )
    )
    .sort((a, b) =>
      consumerSortOrder === 'Name (A-Z)'
        ? a.first_name.localeCompare(b.first_name)
        : b.first_name.localeCompare(a.first_name)
    )

  const filteredSupervisors = supervisors
    .filter((s) => {
      if (supervisorAccessFilter === 'All Access') return true
      if (supervisorAccessFilter === 'owner') return s.is_owner
      if (supervisorAccessFilter === 'no_access') {
        return !s.is_owner && (!s.feature_access || s.feature_access.length === 0)
      }
      return !s.is_owner && s.feature_access?.includes(supervisorAccessFilter)
    })
    .filter((s) => matches(`${s.first_name} ${s.last_name}`, s.email, s.phone_number))
    .sort((a, b) =>
      supervisorSortOrder === 'Name (A-Z)'
        ? a.first_name.localeCompare(b.first_name)
        : b.first_name.localeCompare(a.first_name)
    )

  const linemanPg = usePagination(filteredLinemen)
  const consumerPg = usePagination(filteredConsumers)
  const supervisorPg = usePagination(filteredSupervisors)

  function handleTabChange(key) {
    setActiveTab(key)
    setSearchText('')
    linemanPg.setPage(1)
    consumerPg.setPage(1)
    supervisorPg.setPage(1)
  }

  const linemanFilters = [
    {
      key: 'area',
      label: 'Area Office',
      value: areaFilter,
      defaultValue: 'All Area Offices',
      onChange: (value) => {
        setAreaFilter(value)
        linemanPg.setPage(1)
      },
      options: [
        { value: 'All Area Offices', label: 'All Area Offices' },
        ...areaOffices.map((a) => ({ value: a, label: a })),
      ],
    },
    {
      key: 'shift',
      label: 'Shift',
      value: shiftFilter,
      defaultValue: 'All Shifts',
      onChange: (value) => {
        setShiftFilter(value)
        linemanPg.setPage(1)
      },
      options: [
        { value: 'All Shifts', label: 'All Shifts' },
        { value: 'Morning Duty', label: 'Morning Duty' },
        { value: 'Night Duty', label: 'Night Duty' },
      ],
    },
  ]

  const consumerFilters = [
    {
      key: 'municipality',
      label: 'Municipality',
      value: municipalityFilter,
      defaultValue: 'All Municipalities',
      onChange: (value) => {
        setMunicipalityFilter(value)
        consumerPg.setPage(1)
      },
      options: [
        { value: 'All Municipalities', label: 'All Municipalities' },
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
      defaultValue: 'All Barangays',
      onChange: (value) => {
        setBarangayFilter(value)
        consumerPg.setPage(1)
      },
      options: [
        { value: 'All Barangays', label: 'All Barangays' },
        ...barangayOptions.map((barangay) => ({ value: barangay, label: barangay })),
      ],
    },
  ]

  return (
    <div>
      <Tabs variant="underline" tabs={TABS} value={activeTab} onChange={handleTabChange} />

      <Alert>{error}</Alert>

      {activeTab === 'lineman' ? (
        <>
          <PageHeader
            title="Lineman Accounts"
            description="Manage field personnel accounts under your cooperative."
          />

          <FilterBar className="flex flex-wrap items-center gap-3">
            <SearchInput
              className="flex-1 min-w-[200px]"
              value={searchText}
              onChange={(v) => {
                setSearchText(v)
                linemanPg.setPage(1)
              }}
              placeholder="Search name, email, contact number, company ID, area office…"
            />
            <FilterSelect
              label="SORT"
              value={sortOrder}
              onChange={(value) => {
                setSortOrder(value)
                linemanPg.setPage(1)
              }}
            >
              <option value="Name (A-Z)">Name (A-Z)</option>
              <option value="Name (Z-A)">Name (Z-A)</option>
            </FilterSelect>
            <FilterMenu filters={linemanFilters} />
            <Button dim={false} className="whitespace-nowrap" onClick={() => setShowCreateModal(true)}>
              + Create Lineman Account
            </Button>
            <FilterChips filters={linemanFilters} />
          </FilterBar>

          <DataTable
            columns={LINEMAN_COLUMNS}
            loading={loading}
            isEmpty={filteredLinemen.length === 0}
            empty="No lineman accounts yet."
            footer={!loading && <Pagination {...linemanPg.paginationProps} />}
          >
            {linemanPg.pageItems.map((l) => (
              <LinemanRow key={l.id} lineman={l} duty={dutyById[l.id]} onSelect={setSelectedLineman} />
            ))}
          </DataTable>
        </>
      ) : activeTab === 'consumer' ? (
        <>
          <PageHeader
            title="Consumer Accounts"
            description="View and manage consumer accounts under your cooperative."
          />

          <FilterBar className="flex flex-wrap items-center gap-3">
            <SearchInput
              className="flex-1 min-w-[200px]"
              value={searchText}
              onChange={(v) => {
                setSearchText(v)
                consumerPg.setPage(1)
              }}
              placeholder="Search name, email, contact number, zone, barangay, municipality…"
            />
            <FilterSelect
              label="SORT"
              value={consumerSortOrder}
              onChange={(value) => {
                setConsumerSortOrder(value)
                consumerPg.setPage(1)
              }}
            >
              <option value="Name (A-Z)">Name (A-Z)</option>
              <option value="Name (Z-A)">Name (Z-A)</option>
            </FilterSelect>
            <FilterMenu filters={consumerFilters} />
            <FilterChips filters={consumerFilters} />
          </FilterBar>

          <DataTable
            columns={CONSUMER_COLUMNS}
            loading={loading}
            isEmpty={filteredConsumers.length === 0}
            empty="No consumer accounts yet."
            footer={!loading && <Pagination {...consumerPg.paginationProps} />}
          >
            {consumerPg.pageItems.map((c) => (
              <ConsumerRow key={c.id} consumer={c} onSelect={setSelectedConsumer} />
            ))}
          </DataTable>
        </>
      ) : (
        <>
          <PageHeader
            title="Supervisor Accounts"
            description="Manage other supervisor accounts and their feature access under your cooperative."
          />

          <FilterBar className="flex flex-wrap items-center gap-3">
            <SearchInput
              className="flex-1 min-w-[200px]"
              value={searchText}
              onChange={(v) => {
                setSearchText(v)
                supervisorPg.setPage(1)
              }}
              placeholder="Search name, email, or contact number…"
            />
            <FilterSelect
              label="SORT"
              value={supervisorSortOrder}
              onChange={(value) => {
                setSupervisorSortOrder(value)
                supervisorPg.setPage(1)
              }}
            >
              <option value="Name (A-Z)">Name (A-Z)</option>
              <option value="Name (Z-A)">Name (Z-A)</option>
            </FilterSelect>
            <FilterSelect
              label="FILTER"
              value={supervisorAccessFilter}
              onChange={(value) => {
                setSupervisorAccessFilter(value)
                supervisorPg.setPage(1)
              }}
            >
              <option value="All Access">All Access</option>
              <option value="owner">Owner</option>
              <option value="dispatch">Dispatch</option>
              <option value="advisories">Advisories + Service Areas</option>
              <option value="faq">FAQ</option>
              <option value="billing">Billing Requests</option>
              <option value="no_access">No Access</option>
            </FilterSelect>
            <Button
              dim={false}
              className="whitespace-nowrap"
              onClick={() => setShowCreateSupervisorModal(true)}
            >
              + Create Supervisor Account
            </Button>
          </FilterBar>

          <DataTable
            columns={SUPERVISOR_COLUMNS}
            loading={loading}
            isEmpty={filteredSupervisors.length === 0}
            empty="No supervisor accounts yet."
            footer={!loading && <Pagination {...supervisorPg.paginationProps} />}
          >
            {supervisorPg.pageItems.map((s) => (
              <SupervisorRow
                key={s.id}
                supervisor={s}
                currentUserId={currentUserId}
                onSelect={setSelectedSupervisor}
              />
            ))}
          </DataTable>
        </>
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

      {showCreateSupervisorModal && (
        <CreateSupervisorModal
          cooperativeId={cooperativeId}
          onClose={() => setShowCreateSupervisorModal(false)}
          onCreated={() => {
            setShowCreateSupervisorModal(false)
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

      {selectedSupervisor && (
        <SupervisorDetailsModal
          supervisor={selectedSupervisor}
          currentUserId={currentUserId}
          onClose={() => setSelectedSupervisor(null)}
          onToggleActive={handleToggleActive}
          onSaved={() => {
            setSelectedSupervisor(null)
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
