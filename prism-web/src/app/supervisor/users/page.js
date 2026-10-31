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

  const [areaFilter, setAreaFilter] = useState('All Area')
  const [sortOrder, setSortOrder] = useState('Name (A-Z)')

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

  const filteredLinemen = linemen
    .filter((l) => areaFilter === 'All Area' || l.assigned_area_office === areaFilter)
    .sort((a, b) =>
      sortOrder === 'Name (A-Z)'
        ? a.first_name.localeCompare(b.first_name)
        : b.first_name.localeCompare(a.first_name)
    )

  const linemanPg = usePagination(filteredLinemen)
  const consumerPg = usePagination(consumers)
  const supervisorPg = usePagination(supervisors)

  return (
    <div>
      <Tabs variant="underline" tabs={TABS} value={activeTab} onChange={setActiveTab} />

      <Alert>{error}</Alert>

      {activeTab === 'lineman' ? (
        <>
          <PageHeader
            title="Lineman Accounts"
            description="Manage field personnel accounts under your cooperative."
          />

          <FilterBar>
            <div className="flex items-center gap-6">
              <FilterSelect
                label="AREA"
                value={areaFilter}
                onChange={(value) => {
                  setAreaFilter(value)
                  linemanPg.setPage(1)
                }}
              >
                <option>All Area</option>
                {areaOffices.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="SORT"
                value={sortOrder}
                onChange={(value) => {
                  setSortOrder(value)
                  linemanPg.setPage(1)
                }}
              >
                <option>Name (A-Z)</option>
                <option>Name (Z-A)</option>
              </FilterSelect>
            </div>
            <Button dim={false} onClick={() => setShowCreateModal(true)}>
              + Create Lineman Account
            </Button>
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

          <DataTable
            columns={CONSUMER_COLUMNS}
            loading={loading}
            isEmpty={consumers.length === 0}
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
            actions={
              <Button
                dim={false}
                className="whitespace-nowrap"
                onClick={() => setShowCreateSupervisorModal(true)}
              >
                + Create Supervisor Account
              </Button>
            }
          />

          <DataTable
            columns={SUPERVISOR_COLUMNS}
            loading={loading}
            isEmpty={supervisors.length === 0}
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
