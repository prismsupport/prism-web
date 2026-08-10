'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'

export default function AllCooperativesPage() {
  const [cooperatives, setCooperatives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAll() {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('cooperatives')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setCooperatives(data)
      }
      setLoading(false)
    }

    fetchAll()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">All Cooperatives</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Every registered cooperative and its current status.
      </p>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && cooperatives.length === 0 && (
        <p className="text-sm text-gray-500">No cooperatives registered yet.</p>
      )}

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
            {cooperatives.map((coop) => (
              <tr
                key={coop.id}
                className="border-b border-gray-100 last:border-0"
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
      </div>
    </div>
  )
}