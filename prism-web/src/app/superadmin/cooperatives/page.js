'use client'

import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, Clock, PauseCircle, XCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/ui/Pagination'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import DataTable from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar'
import { FilterMenu, FilterChips } from '@/components/ui/FilterMenu'
import CooperativeRow from '@/components/superadmin/CooperativeRow'
import EmptyState from '@/components/ui/EmptyState'
import { PAGE_SIZE } from '@/lib/usePagination'

const COLUMNS = [
  'Cooperative',
  'Location',
  'Contact',
  'Submitted',
  'Last Updated',
  { label: 'Status', className: 'text-center' },
  { label: 'Action', className: 'text-right' },
]

const SORTS = {
  newest: { label: 'Newest submitted', column: 'created_at', ascending: false },
  oldest: { label: 'Oldest submitted', column: 'created_at', ascending: true },
  updated: { label: 'Recently updated', column: 'updated_at', ascending: false },
  name_asc: { label: 'Name (A-Z)', column: 'cooperative_name', ascending: true },
  name_desc: { label: 'Name (Z-A)', column: 'cooperative_name', ascending: false },
}

const DATE_RANGES = [
  { value: 'all', label: 'Any time', days: null },
  { value: '7', label: 'Last 7 days', days: 7 },
  { value: '30', label: 'Last 30 days', days: 30 },
  { value: '90', label: 'Last 90 days', days: 90 },
]

const statusCards = [
  { key: 'All', label: 'All cooperatives', icon: Building2, tint: 'bg-blue-50 text-blue-700', bar: 'bg-blue-600' },
  { key: 'Pending Approval', label: 'Pending approval', icon: Clock, tint: 'bg-red-50 text-red-600', bar: 'bg-red-500' },
  { key: 'Active', label: 'Active', icon: CheckCircle2, tint: 'bg-green-50 text-green-700', bar: 'bg-green-500' },
  { key: 'Rejected', label: 'Rejected', icon: XCircle, tint: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400' },
  { key: 'Deactivated', label: 'Deactivated', icon: PauseCircle, tint: 'bg-gray-100 text-gray-600', bar: 'bg-gray-400' },
]

function StatusTile({ card, count, total, active, onClick }) {
  const Icon = card.icon
  const isAll = card.key === 'All'
  const share = count != null && total > 0 ? Math.round((count / total) * 100) : 0
  const needsAttention = card.key === 'Pending Approval' && count > 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 ${
        active
          ? 'border-blue-600 ring-2 ring-blue-600/20'
          : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${card.tint}`}>
          <Icon size={18} aria-hidden="true" />
          {needsAttention && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
          )}
        </span>
        {!isAll && count != null && (
          <span className="text-xs font-semibold tabular-nums text-gray-400">{share}%</span>
        )}
      </div>
      <p className="font-display mt-3 text-3xl font-extrabold tabular-nums text-gray-900">
        {count ?? '–'}
      </p>
      <p className="mt-0.5 text-xs font-medium text-gray-500">{card.label}</p>
      <div className="mt-3 h-1 w-full rounded-full bg-gray-100">
        <div
          className={`h-1 rounded-full transition-all ${card.bar}`}
          style={{ width: `${isAll ? (count > 0 ? 100 : 0) : share}%` }}
        />
      </div>
    </button>
  )
}

export default function AllCooperativesPage() {
  const [counts, setCounts] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchText, setSearchText] = useState('')
  const [sortKey, setSortKey] = useState('newest')
  const [provinceFilter, setProvinceFilter] = useState('all')
  const [rangeFilter, setRangeFilter] = useState('all')
  const [provinceOptions, setProvinceOptions] = useState([])
  const [page, setPage] = useState(1)

  const [cooperatives, setCooperatives] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCounts() {
      const supabase = createClient()
      const results = await Promise.all(
        statusCards
          .filter((c) => c.key !== 'All')
          .map((c) =>
            supabase
              .from('cooperatives')
              .select('id', { count: 'exact', head: true })
              .eq('status', c.key)
          )
      )

      const newCounts = { All: 0 }
      statusCards
        .filter((c) => c.key !== 'All')
        .forEach((c, i) => {
          const n = results[i].count ?? 0
          newCounts[c.key] = n
          newCounts.All += n
        })

      setCounts(newCounts)
    }

    fetchCounts()
  }, [])

  useEffect(() => {
    async function fetchLocationOptions() {
      const supabase = createClient()
      const { data } = await supabase.from('cooperatives').select('province')
      const rows = data || []
      setProvinceOptions(
        [...new Set(rows.map((r) => r.province?.trim()).filter(Boolean))].sort((a, b) =>
          a.localeCompare(b)
        )
      )
    }

    fetchLocationOptions()
  }, [])

  useEffect(() => {
    async function fetchCooperatives() {
      setLoading(true)
      setError('')
      const supabase = createClient()

      let query = supabase
        .from('cooperatives')
        .select('*', { count: 'exact' })
        .order(SORTS[sortKey].column, { ascending: SORTS[sortKey].ascending })

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter)
      }

      if (provinceFilter !== 'all') {
        query = query.eq('province', provinceFilter)
      }

      const rangeDays = DATE_RANGES.find((r) => r.value === rangeFilter)?.days
      if (rangeDays) {
        const since = new Date()
        since.setDate(since.getDate() - rangeDays)
        query = query.gte('created_at', since.toISOString())
      }

      if (searchText.trim()) {
        query = query.ilike('cooperative_name', `%${searchText.trim()}%`)
      }

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.range(from, to)

      const { data, error: fetchError, count } = await query

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setCooperatives(data)
        setTotalCount(count ?? 0)
      }
      setLoading(false)
    }

    fetchCooperatives()
  }, [statusFilter, searchText, page, sortKey, provinceFilter, rangeFilter])

  function handleCardClick(key) {
    setStatusFilter(key)
    setPage(1)
  }

  function handleSearchChange(value) {
    setSearchText(value)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const pending = counts?.['Pending Approval'] ?? 0
  const hasFilters =
    statusFilter !== 'All' ||
    provinceFilter !== 'all' ||
    rangeFilter !== 'all' ||
    searchText.trim()

  // Wraps a filter setter so changing a filter returns to page 1
  const withReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const filters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      defaultValue: 'All',
      onChange: withReset(setStatusFilter),
      options: statusCards.map((c) => ({
        value: c.key,
        label: c.key === 'All' ? 'All statuses' : c.label,
      })),
    },
    {
      key: 'province',
      label: 'Province',
      value: provinceFilter,
      onChange: withReset(setProvinceFilter),
      options: [
        { value: 'all', label: 'All provinces' },
        ...provinceOptions.map((p) => ({ value: p, label: p })),
      ],
    },
    {
      key: 'submitted',
      label: 'Submitted',
      value: rangeFilter,
      onChange: withReset(setRangeFilter),
      options: DATE_RANGES.map((r) => ({ value: r.value, label: r.label })),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Cooperatives"
        description="Review new registrations and manage every cooperative on the platform."
      />

      {pending > 0 && statusFilter !== 'Pending Approval' && (
        <div
          role="status"
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-white px-5 py-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70 motion-reduce:animate-none" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
            </span>
            <div>
              <p className="text-sm font-bold text-red-800">
                {pending} registration{pending === 1 ? '' : 's'} waiting for your review
              </p>
              <p className="text-xs text-red-700/80">
                Supervisors cannot log in until their cooperative is approved.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCardClick('Pending Approval')}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            Review now
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {statusCards.map((card) => (
          <StatusTile
            key={card.key}
            card={card}
            count={counts ? counts[card.key] : null}
            total={counts?.All ?? 0}
            active={statusFilter === card.key}
            onClick={() => handleCardClick(card.key)}
          />
        ))}
      </div>

      <FilterBar className="flex flex-wrap items-center gap-3">
        <SearchInput
          className="min-w-[200px] flex-1"
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search by cooperative name…"
        />
        <FilterSelect label="SORT" value={sortKey} onChange={withReset(setSortKey)}>
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </FilterSelect>
        <FilterMenu filters={filters} />
        <FilterChips filters={filters} />
      </FilterBar>

      <Alert>{error}</Alert>

      <DataTable
        columns={COLUMNS}
        loading={loading}
        skeletonRows={6}
        isEmpty={cooperatives.length === 0}
        empty={
          <EmptyState
            title={hasFilters ? 'No cooperatives match this view' : 'No cooperatives yet'}
            description={
              hasFilters
                ? 'Try a different status or search for another name.'
                : 'Cooperatives appear here as soon as a supervisor registers one.'
            }
          />
        }
        footer={
          !loading && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )
        }
      >
        {cooperatives.map((coop) => (
          <CooperativeRow key={coop.id} coop={coop} />
        ))}
      </DataTable>
    </div>
  )
}