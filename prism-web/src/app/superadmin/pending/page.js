'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'

export default function PendingRegistrationsPage() {
  const [cooperatives, setCooperatives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPending() {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('cooperatives')
        .select('*')
        .eq('status', 'Pending Approval')
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setCooperatives(data)
      }
      setLoading(false)
    }

    fetchPending()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Pending Registrations</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Cooperative registrations awaiting approval.
      </p>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && cooperatives.length === 0 && (
        <p className="text-sm text-gray-500">
          No pending registrations right now.
        </p>
      )}

      <div className="space-y-3">
        {cooperatives.map((coop) => (
          <Link
            key={coop.id}
            href={`/superadmin/cooperatives/${coop.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {coop.cooperative_name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {coop.office_address}, {coop.municipality}, {coop.province}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {coop.contact_number} · {coop.official_email}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Submitted:{' '}
                  {new Date(coop.created_at).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <StatusBadge status={coop.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}