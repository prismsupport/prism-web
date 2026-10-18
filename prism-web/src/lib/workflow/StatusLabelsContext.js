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

// Fallback only. The real list comes from get_priority_levels() in the database.
// Ordered lowest to highest, rank 1 = lowest.
export const DEFAULT_PRIORITY_LEVELS = [
  { key: 'low', label: 'Low', rank: 1 },
  { key: 'medium', label: 'Medium', rank: 2 },
  { key: 'high', label: 'High', rank: 3 },
  { key: 'critical', label: 'Critical', rank: 4 },
]

function humanize(code) {
  return String(code)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function makeStatusLabel(labels) {
  return (code) => {
    if (!code) return '—'
    return labels[String(code).toLowerCase()] || humanize(code)
  }
}

function makePriorityLabel(levels) {
  return (key) => {
    if (!key) return 'None'
    const level = levels.find((l) => l.key === key)
    return level ? level.label : humanize(key)
  }
}

const StatusLabelsContext = createContext({
  labels: DEFAULT_STATUS_LABELS,
  priorityLevels: DEFAULT_PRIORITY_LEVELS,
  statusLabel: makeStatusLabel(DEFAULT_STATUS_LABELS),
  priorityLabel: makePriorityLabel(DEFAULT_PRIORITY_LEVELS),
  refresh: async () => {},
})

export function StatusLabelsProvider({ children }) {
  const [labels, setLabels] = useState(DEFAULT_STATUS_LABELS)
  const [priorityLevels, setPriorityLevels] = useState(DEFAULT_PRIORITY_LEVELS)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const [labelRes, levelRes] = await Promise.all([
      supabase.rpc('get_status_labels'),
      supabase.rpc('get_priority_levels'),
    ])

    if (!labelRes.error && labelRes.data) {
      setLabels({ ...DEFAULT_STATUS_LABELS, ...labelRes.data })
    }
    if (!levelRes.error && Array.isArray(levelRes.data) && levelRes.data.length > 0) {
      setPriorityLevels(levelRes.data)
    }
  }

  return (
    <StatusLabelsContext.Provider
      value={{
        labels,
        priorityLevels,
        statusLabel: makeStatusLabel(labels),
        priorityLabel: makePriorityLabel(priorityLevels),
        refresh: load,
      }}
    >
      {children}
    </StatusLabelsContext.Provider>
  )
}

export function useStatusLabels() {
  return useContext(StatusLabelsContext)
}