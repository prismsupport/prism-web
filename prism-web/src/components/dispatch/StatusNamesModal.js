'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import StatusPill from '@/components/ui/StatusPill'
import { toast } from '@/lib/toast'
import {
  DEFAULT_STATUS_LABELS,
  TICKET_STATUS_CODES,
  JOB_STATUS_CODES,
  useStatusLabels,
} from '@/lib/workflow/StatusLabelsContext'

// help text shows on hover (title) instead of taking a line on every row
const HELP = {
  pending: 'Report received, no lineman assigned yet',
  dispatched: 'A lineman has been assigned',
  in_progress: 'The repair is underway (ticket status and job step)',
  qa_review: 'Marked fixed, waiting for supervisor review',
  resolved: 'Approved and closed (ticket status and job step)',
  cancelled: 'Report declined by a supervisor',
  assigned: 'Lineman assigned, not on the move yet',
  on_the_way: 'Lineman is travelling to the site',
  arrived_at_site: 'Lineman is at the site',
  fixed: 'Lineman marked the repair as done',
}

const TICKET_ROWS = TICKET_STATUS_CODES
const JOB_ONLY_ROWS = JOB_STATUS_CODES.filter((c) => !TICKET_STATUS_CODES.includes(c))
const ALL_CODES = [...TICKET_ROWS, ...JOB_ONLY_ROWS]

function findProblem(values) {
  for (const code of ALL_CODES) {
    const text = values[code].trim()
    if (text.length < 1) return 'Every status needs a name.'
    if (text.length > 30) return 'Names can be at most 30 characters.'
  }

  const groups = [
    { name: 'ticket statuses', codes: TICKET_STATUS_CODES },
    { name: 'job steps', codes: JOB_STATUS_CODES },
  ]
  for (const group of groups) {
    const seen = new Set()
    for (const code of group.codes) {
      const key = values[code].trim().toLowerCase()
      if (seen.has(key)) {
        return `"${values[code].trim()}" is used twice among the ${group.name}. Each name in a group must be different.`
      }
      seen.add(key)
    }
  }
  return ''
}

export default function StatusNamesModal({ onClose }) {
  const { labels, refresh } = useStatusLabels()
  const [values, setValues] = useState({ ...labels })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setValue(code, text) {
    setValues((prev) => ({ ...prev, [code]: text }))
  }

  async function handleSave() {
    const problem = findProblem(values)
    if (problem) {
      setError(problem)
      return
    }

    setSaving(true)
    setError('')

    const payload = {}
    ALL_CODES.forEach((code) => {
      payload[code] = values[code].trim()
    })

    const supabase = createClient()
    const { error: saveError } = await supabase.rpc('set_status_labels', { p_labels: payload })

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    await refresh()
    toast.success('Status names updated')
    onClose()
  }

  function renderRow(code) {
    const changed = values[code] !== DEFAULT_STATUS_LABELS[code]
    return (
      <div key={code} className="border border-gray-200 rounded-lg p-2.5" title={HELP[code]}>
        <div className="flex items-center gap-2">
          <div className="w-32 shrink-0">
            <StatusPill status={code} label={values[code].trim() || '—'} />
          </div>
          <input
            value={values[code]}
            maxLength={30}
            onChange={(e) => setValue(code, e.target.value)}
            aria-label={`Name for ${DEFAULT_STATUS_LABELS[code]}`}
            className="min-w-0 flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
          />
        </div>
        <div className="flex items-center justify-between mt-1 pl-[8.5rem]">
          <span className="text-xs text-gray-400">Default: {DEFAULT_STATUS_LABELS[code]}</span>
          {changed && (
            <button
              type="button"
              onClick={() => setValue(code, DEFAULT_STATUS_LABELS[code])}
              className="text-xs font-semibold text-blue-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Modal title="Status Names" onClose={onClose} size="xxl" stickyHeader>
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Rename how statuses appear for your cooperative. Colors and the underlying workflow stay
        the same. Hover a row for what it means.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">
            Ticket statuses
          </p>
          <div className="space-y-2">{TICKET_ROWS.map(renderRow)}</div>
        </div>
        <div>
          <p className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">
            Job steps only
          </p>
          <div className="space-y-2">{JOB_ONLY_ROWS.map(renderRow)}</div>
          <p className="text-xs text-gray-400 mt-3">
            In Progress and Resolved are also job steps, so they use the name set under Ticket
            statuses.
          </p>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setValues({ ...DEFAULT_STATUS_LABELS })}
          className="text-sm font-semibold text-gray-600"
        >
          Reset all to defaults
        </button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" dim={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Names'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}