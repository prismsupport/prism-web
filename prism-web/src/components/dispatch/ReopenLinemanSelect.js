'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadShiftInfo, shiftBadge, isOffDuty } from '@/lib/lineman/shiftInfo'

// "Assign to" choice for a job that goes back to a lineman (reopen, QA rejection,
// approved consumer request). Defaults to the original lineman.
// value / onChange hold the chosen lineman id.
export default function ReopenLinemanSelect({ originalLinemanId, value, onChange, className = '' }) {
  const [linemen, setLinemen] = useState([])
  const [info, setInfo] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const [usersRes, shifts] = await Promise.all([
        supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('user_type', 'lineman')
          .eq('is_active', true)
          .order('first_name', { ascending: true }),
        loadShiftInfo(supabase),
      ])
      if (cancelled) return
      setLinemen(usersRes.data || [])
      setInfo(shifts)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!value && originalLinemanId) onChange(originalLinemanId)
  }, [value, originalLinemanId])

  const current = value || originalLinemanId
  const originalOff = isOffDuty(info[originalLinemanId])
  const chosenOff = current !== originalLinemanId && isOffDuty(info[current])

  return (
    <div className={className}>
      <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">ASSIGN TO</label>
      <select
        value={current || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
      >
        {linemen.map((l) => {
          const badge = shiftBadge(info[l.id])
          return (
            <option key={l.id} value={l.id}>
              {l.first_name} {l.last_name}
              {l.id === originalLinemanId ? ' (original lineman)' : ''}
              {badge ? ` · ${badge.text.toLowerCase()}` : ''}
            </option>
          )
        })}
      </select>
      {originalOff && current === originalLinemanId && (
        <p className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          The original lineman is off schedule. Choose another lineman if this should be handled now.
        </p>
      )}
      {chosenOff && (
        <p className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This lineman is also off schedule. You can still assign them for an emergency.
        </p>
      )}
    </div>
  )
}