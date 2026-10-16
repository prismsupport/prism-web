'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Fallback only. The real names come from get_status_labels() in the database.
// Keep this list in step with default_status_labels() in SQL.
export const DEFAULT_STATUS_LABELS = {
  pending: 'Pending',
  dispatched: 'Dispatched',
  in_progress: 'In Progress',
  qa_review: 'QA Review',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
  assigned: 'Assigned',
  on_the_way: 'On The Way',
  arrived_at_site: 'Arrived At Site',
  fixed: 'Fixed',
}

// A name must be unique within each group (in_progress and resolved are in both)
export const TICKET_STATUS_CODES = ['pending', 'dispatched', 'in_progress', 'qa_review', 'resolved', 'cancelled']
export const JOB_STATUS_CODES = ['assigned', 'on_the_way', 'arrived_at_site', 'in_progress', 'fixed', 'resolved']

function fallbackLabel(code) {
  return String(code)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const StatusLabelsContext = createContext({
  labels: DEFAULT_STATUS_LABELS,
  statusLabel: (code) => (code ? DEFAULT_STATUS_LABELS[String(code).toLowerCase()] || fallbackLabel(code) : '—'),
  refresh: async () => {},
})

export function StatusLabelsProvider({ children }) {
  const [labels, setLabels] = useState(DEFAULT_STATUS_LABELS)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_status_labels')
    if (!error && data) setLabels({ ...DEFAULT_STATUS_LABELS, ...data })
  }

  function statusLabel(code) {
    if (!code) return '—'
    return labels[String(code).toLowerCase()] || fallbackLabel(code)
  }

  return (
    <StatusLabelsContext.Provider value={{ labels, statusLabel, refresh: load }}>
      {children}
    </StatusLabelsContext.Provider>
  )
}

export function useStatusLabels() {
  return useContext(StatusLabelsContext)
}