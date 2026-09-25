'use client'

import { useState } from 'react'
import Pagination from '@/components/ui/Pagination'
import BillingStatusPill from '@/components/users/BillingStatusPill'

const PAGE_SIZE = 10

export default function BillingRequestsTab({ billingRequests, statusFilter, onFilterChange, onSelectRequest }) {
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