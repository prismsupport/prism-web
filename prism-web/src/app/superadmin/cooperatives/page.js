'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatCard, { StatCardGrid } from '@/components/ui/StatCard'
import Pagination from '@/components/ui/Pagination'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import DataTable from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import CooperativeRow from '@/components/superadmin/CooperativeRow'
import EmptyState from '@/components/ui/EmptyState'
import { PAGE_SIZE } from '@/lib/usePagination'

const COLUMNS = [
  'Cooperative',
  'Office Address',
  'Official Email',
  'Submission Date',
  'Last Updated',
  'Status',
  'Actions',
]

const statusCards = [
  { key: 'All', label: 'All Cooperatives', color: 'text-blue-700' },
  { key: 'Pending Approval', label: 'Pending Approval', color: 'text-red-600' },
  { key: 'Active', label: 'Active', color: 'text-green-600' },
  { key: 'Rejected', label: 'Rejected', color: 'text-amber-500' },
  { key: 'Deactivated', label: 'Deactivated', color: 'text-gray-900' },
]

export default function AllCooperativesPage() {
  const [counts, setCounts] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchText, setSearchText] = useState('')
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
    async function fetchCooperatives() {
      setLoading(true)
      setError('')
      const supabase = createClient()

      let query = supabase
        .from('cooperatives')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter)
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
  }, [statusFilter, searchText, page])

  function handleCardClick(key) {
    setStatusFilter(key)
    setPage(1)
  }

  function handleSearchChange(value) {
    setSearchText(value)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div>
      <PageHeader
        title="All Cooperatives"
        description="Every registered cooperative on the platform. Click a status below to filter."
      />

      <StatCardGrid columns={5}>
        {statusCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={counts ? counts[card.key] : '–'}
            color={card.color}
            active={statusFilter === card.key}
            onClick={() => handleCardClick(card.key)}
          />
        ))}
      </StatCardGrid>

      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          size="lg"
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search Cooperative Name…"
        />

        {statusFilter !== 'All' && (
          <button
            onClick={() => handleCardClick('All')}
            className="text-sm text-blue-700 font-medium whitespace-nowrap"
          >
            Clear filter
          </button>
        )}
      </div>

      <Alert>{error}</Alert>

      <DataTable
        columns={COLUMNS}
        loading={loading}
        skeletonRows={6}
        isEmpty={cooperatives.length === 0}
        empty={
          <EmptyState
            title="No cooperatives match this view"
            description="Try a different status filter or search for another cooperative."
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
