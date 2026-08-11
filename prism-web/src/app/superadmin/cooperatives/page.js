'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'

const PAGE_SIZE = 10

const statusCards = [
  { key: 'All', label: 'All Cooperatives', color: 'text-blue-700', bg: 'bg-blue-50', ring: 'ring-blue-600' },
  { key: 'Pending Approval', label: 'Pending Approval', color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-500' },
  { key: 'Active', label: 'Active', color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-500' },
  { key: 'Rejected', label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-500' },
  { key: 'Deactivated', label: 'Deactivated', color: 'text-gray-600', bg: 'bg-gray-100', ring: 'ring-gray-500' },
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

  // Fetch the counts for the summary cards once on load
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

  // Re-fetch the table whenever filter, search, or page changes
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
        {statusCards.map((card) => {
          const isActive = statusFilter === card.key
          return (
            <button
              key={card.key}
              onClick={() => handleCardClick(card.key)}
              className={`text-left bg-white rounded-xl border p-4 transition-all ${
                isActive
                  ? `border-transparent ring-2 ${card.ring}`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${card.bg} ${card.color} font-bold text-xs mb-2`}
              >
                {counts ? counts[card.key] : '–'}
              </div>
              <p className="text-sm font-medium text-gray-900">
                {card.label}
              </p>
            </button>
          )
        })}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search cooperative name…"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {statusFilter !== 'All' && (
          <button
            onClick={() => handleCardClick('All')}
            className="text-sm text-blue-700 font-medium"
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
              <th className="px-5 py-3 font-semibold">Municipality</th>
              <th className="px-5 py-3 font-semibold">Submitted</th>
              <th className="px-5 py-3 font-semibold">Status</th>
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

            {!loading && cooperatives.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  No cooperatives match this view.
                </td>
              </tr>
            )}

            {!loading &&
              cooperatives.map((coop) => (
                <tr
                  key={coop.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/superadmin/cooperatives/${coop.id}`}
                      className="font-medium text-gray-900 hover:text-blue-700"
                    >
                      {coop.cooperative_name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {coop.municipality}, {coop.province}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(coop.created_at).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={coop.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 disabled:opacity-40 hover:bg-white"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 disabled:opacity-40 hover:bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}