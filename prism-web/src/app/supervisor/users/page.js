'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import usePagination from '@/lib/usePagination'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { FilterSelect } from '@/components/ui/FilterBar'
import Tabs from '@/components/ui/Tabs'
import UserListPanel from '@/components/users/UserListPanel'
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
import {
  TABS,
  LINEMAN_COLUMNS,
  CONSUMER_COLUMNS,
  SUPERVISOR_COLUMNS,
} from '@/lib/users/constants'
import {
  filterLinemen,
  filterConsumers,
  filterSupervisors,
  municipalityOptionsOf,
  barangayOptionsOf,
} from '@/lib/users/filters'
import { useUsersData, useLinemanDutyStatus } from '@/lib/users/useUsersData'

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('lineman')

  const {
    cooperativeId,
    currentUserId,
    areaOffices,
    setAreaOffices,
    linemen,
    consumers,
    supervisors,
    loading,
    error,
    reload,
  } = useUsersData()

  // Keep the live duty badges fresh while the Personnel tab is open
  const dutyById = useLinemanDutyStatus(activeTab === 'lineman')

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
    await reload()
    setSelectedLineman(null)
    setSelectedConsumer(null)
    setSelectedSupervisor(null)
  }

  const filteredLinemen = filterLinemen(linemen, {
    areaFilter,
    shiftFilter,
    sortOrder,
    searchText,
  })

  const municipalityOptions = municipalityOptionsOf(consumers)
  const barangayOptions = barangayOptionsOf(consumers)

  const filteredConsumers = filterConsumers(consumers, {
    municipalityFilter,
    barangayFilter,
    sortOrder: consumerSortOrder,
    searchText,
  })

  const filteredSupervisors = filterSupervisors(supervisors, {
    accessFilter: supervisorAccessFilter,
    sortOrder: supervisorSortOrder,
    searchText,
  })

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
        <UserListPanel
          title="Lineman Accounts"
          description="Manage field personnel accounts under your cooperative."
          searchPlaceholder="Search name, email, contact number, company ID, area office…"
          searchText={searchText}
          onSearchChange={(v) => {
            setSearchText(v)
            linemanPg.setPage(1)
          }}
          sortValue={sortOrder}
          onSortChange={(value) => {
            setSortOrder(value)
            linemanPg.setPage(1)
          }}
          filters={linemanFilters}
          action={
            <Button dim={false} className="whitespace-nowrap" onClick={() => setShowCreateModal(true)}>
              + Create Lineman Account
            </Button>
          }
          columns={LINEMAN_COLUMNS}
          loading={loading}
          isEmpty={filteredLinemen.length === 0}
          emptyText="No lineman accounts yet."
          paginationProps={linemanPg.paginationProps}
        >
          {linemanPg.pageItems.map((l) => (
            <LinemanRow key={l.id} lineman={l} duty={dutyById[l.id]} onSelect={setSelectedLineman} />
          ))}
        </UserListPanel>
      ) : activeTab === 'consumer' ? (
        <UserListPanel
          title="Consumer Accounts"
          description="View and manage consumer accounts under your cooperative."
          searchPlaceholder="Search name, email, contact number, account number, zone, barangay, municipality…"
          searchText={searchText}
          onSearchChange={(v) => {
            setSearchText(v)
            consumerPg.setPage(1)
          }}
          sortValue={consumerSortOrder}
          onSortChange={(value) => {
            setConsumerSortOrder(value)
            consumerPg.setPage(1)
          }}
          filters={consumerFilters}
          columns={CONSUMER_COLUMNS}
          loading={loading}
          isEmpty={filteredConsumers.length === 0}
          emptyText="No consumer accounts yet."
          paginationProps={consumerPg.paginationProps}
        >
          {consumerPg.pageItems.map((c) => (
            <ConsumerRow key={c.id} consumer={c} onSelect={setSelectedConsumer} />
          ))}
        </UserListPanel>
      ) : (
        <UserListPanel
          title="Supervisor Accounts"
          description="Manage other supervisor accounts and their feature access under your cooperative."
          searchPlaceholder="Search name, email, or contact number…"
          searchText={searchText}
          onSearchChange={(v) => {
            setSearchText(v)
            supervisorPg.setPage(1)
          }}
          sortValue={supervisorSortOrder}
          onSortChange={(value) => {
            setSupervisorSortOrder(value)
            supervisorPg.setPage(1)
          }}
          extraControls={
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
              <option value="no_access">No Access</option>
            </FilterSelect>
          }
          action={
            <Button
              dim={false}
              className="whitespace-nowrap"
              onClick={() => setShowCreateSupervisorModal(true)}
            >
              + Create Supervisor Account
            </Button>
          }
          columns={SUPERVISOR_COLUMNS}
          loading={loading}
          isEmpty={filteredSupervisors.length === 0}
          emptyText="No supervisor accounts yet."
          paginationProps={supervisorPg.paginationProps}
        >
          {supervisorPg.pageItems.map((s) => (
            <SupervisorRow
              key={s.id}
              supervisor={s}
              currentUserId={currentUserId}
              onSelect={setSelectedSupervisor}
            />
          ))}
        </UserListPanel>
      )}

      {showCreateModal && (
        <CreateLinemanModal
          cooperativeId={cooperativeId}
          areaOffices={areaOffices}
          onManageAreas={() => setShowManageAreas(true)}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            reload()
          }}
        />
      )}

      {showCreateSupervisorModal && (
        <CreateSupervisorModal
          cooperativeId={cooperativeId}
          onClose={() => setShowCreateSupervisorModal(false)}
          onCreated={() => {
            setShowCreateSupervisorModal(false)
            reload()
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
            reload()
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
            reload()
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