'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Name of the column on the reports table that holds the account number the
// consumer reported under. If your column is named differently, change this
// one word.
const ACCOUNT_COLUMN = 'account_number'

// Shows who filed a report: name, phone number, and account number.
// It loads these itself, so a screen only needs to pass the report's ID
// and the consumer's ID.
//   compact = a single small line (used in lists)
export default function ReporterInfo({ reportId, consumerId, compact = false }) {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()

      const [userRes, reportRes] = await Promise.all([
        consumerId
          ? supabase
              .from('users')
              .select('first_name, last_name, phone_number')
              .eq('id', consumerId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        reportId
          ? supabase.from('reports').select(ACCOUNT_COLUMN).eq('report_id', reportId).maybeSingle()
          : Promise.resolve({ data: null }),
      ])

      if (cancelled) return
      setInfo({
        name: userRes.data ? `${userRes.data.first_name} ${userRes.data.last_name}` : null,
        phone: userRes.data?.phone_number || null,
        accountNumber: reportRes.data?.[ACCOUNT_COLUMN] || null,
      })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [reportId, consumerId])

  if (!info) {
    return <p className="text-xs text-gray-400 mb-3">Loading reporter…</p>
  }

  if (compact) {
    return (
      <p className="text-xs text-gray-500 mt-0.5">
        {info.phone || 'No phone'} · Acct {info.accountNumber || '—'}
      </p>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Reporter</p>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Name</p>
          <p className="text-gray-900 font-medium break-words">{info.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Phone number</p>
          <p className="text-gray-900 font-medium break-words">{info.phone || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Account number</p>
          <p className="text-gray-900 font-medium break-words">{info.accountNumber || '—'}</p>
        </div>
      </div>
    </div>
  )
}