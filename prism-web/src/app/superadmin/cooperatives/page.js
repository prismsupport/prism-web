'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import StatCard from '@/components/ui/StatCard'

const PAGE_SIZE = 10

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

  function handleSearchChange(e) {
    setSearchText(e.target.value)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">All Cooperatives</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Every registered cooperative on the platform. Click a status below to
        filter.
      </p>

      {/* Summary / filter cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statusCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={counts ? counts[card.key] : '–'}
            color={card.color}
            isActive={statusFilter === card.key}
            onClick={() => handleCardClick(card.key)}
          />
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
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
            onChange={handleSearchChange}
            placeholder="Search Cooperative Name…"
            className="w-full pl-10 pr-3.5 py-3 rounded-lg border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {statusFilter !== 'All' && (
          <button
            onClick={() => handleCardClick('All')}
            className="text-sm text-blue-700 font-medium whitespace-nowrap cursor-pointer"
          >
            Clear filter
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Cooperative</th>
              <th className="px-5 py-3 font-semibold">Office Address</th>
              <th className="px-5 py-3 font-semibold">Official Email</th>
              <th className="px-5 py-3 font-semibold">Submission Date</th>
              <th className="px-5 py-3 font-semibold">Last Updated</th>
              <th className="px-5 py-3 font-semibold">Status</th>
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

            {!loading && cooperatives.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  No cooperatives match this view.
                </td>
              </tr>
            )}

            {!loading &&
              cooperatives.map((coop) => {
                // "Last Updated" only means something once the row has
                // actually changed — if updated_at still equals created_at,
                // nothing has happened to it since submission.
                const hasBeenUpdated = coop.updated_at !== coop.created_at
                const isPending = coop.status === 'Pending Approval'

                return (
                  <tr
                    key={coop.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900 uppercase">
                        {coop.cooperative_name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800 uppercase text-xs">
                        {coop.municipality}, {coop.province}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {coop.office_address}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {coop.official_email}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(coop.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {hasBeenUpdated
                        ? new Date(coop.updated_at).toLocaleDateString(
                            'en-PH',
                            { year: 'numeric', month: 'long', day: 'numeric' }
                          )
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={coop.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/superadmin/cooperatives/${coop.id}`}
                        className={
                          isPending
                            ? 'inline-block bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors'
                            : 'inline-block bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors'
                        }
                      >
                        {isPending ? 'Review' : 'Details'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 disabled:opacity-40 hover:bg-white cursor-pointer"
              >
                ‹
              </button>
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 disabled:opacity-40 hover:bg-white cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}