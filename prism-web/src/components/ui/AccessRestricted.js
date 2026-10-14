'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Shown in place of a page the signed-in Supervisor isn't allowed to open.
export default function AccessRestricted({ pageName, ownerOnly = false }) {
  const [ownerName, setOwnerName] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadOwner() {
      const supabase = createClient()

      const { data: ownerRow } = await supabase
        .from('supervisor')
        .select('profile_id')
        .eq('is_owner', true)
        .maybeSingle()
      if (!ownerRow || cancelled) return

      const { data: person } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', ownerRow.profile_id)
        .maybeSingle()
      if (person && !cancelled) {
        setOwnerName(`${person.first_name} ${person.last_name}`)
      }
    }

    loadOwner()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-2">
        You don&apos;t have access to {pageName}
      </h1>

      <p className="text-sm text-gray-500 mb-1">
        {ownerOnly
          ? `Only the cooperative owner can open ${pageName}.`
          : `${pageName} isn't included in the access assigned to your account.`}
      </p>
      <p className="text-sm text-gray-500 mb-6">
        If you need access, please contact{' '}
        <span className="font-medium text-gray-700">
          {ownerName || 'your cooperative owner'}
        </span>
        .
      </p>

      <Link
        href="/supervisor/dashboard"
        className="inline-block bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}