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

const ROWS = [
  { code: 'pending', used: 'Ticket', help: 'Report received, no lineman assigned yet' },
  { code: 'dispatched', used: 'Ticket', help: 'A lineman has been assigned' },
  { code: 'in_progress', used: 'Ticket and job step', help: 'The repair is underway' },
  { code: 'qa_review', used: 'Ticket', help: 'Marked fixed, waiting for supervisor review' },
  { code: 'resolved', used: 'Ticket and job step', help: 'Approved and closed' },
  { code: 'cancelled', used: 'Ticket', help: 'Report declined by a supervisor' },
  { code: 'assigned', used: 'Job step', help: 'Lineman assigned, not on the move yet' },
  { code: 'on_the_way', used: 'Job step', help: 'Lineman is travelling to the site' },
  { code: 'arrived_at_site', used: 'Job step', help: 'Lineman is at the site' },
  { code: 'fixed', used: 'Job step', help: 'Lineman marked the repair as done' },
]

function findProblem(values) {
  for (const row of ROWS) {
    const text = values[row.code].trim()
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
    ROWS.forEach((r) => {
      payload[r.code] = values[r.code].trim()
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

  return (
    <Modal title="Status Names" onClose={onClose} size="xl">
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Rename how statuses appear for your cooperative. Colors and the underlying workflow
        stay the same, so nothing about how tickets move changes.
      </p>

      <div className="space-y-3 mb-4">
        {ROWS.map((row) => {
          const changed = values[row.code] !== DEFAULT_STATUS_LABELS[row.code]
          return (
            <div
              key={row.code}
              className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 items-center border border-gray-200 rounded-lg p-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusPill status={row.code} label={values[row.code].trim() || '—'} />
                  <span className="text-xs text-gray-400">{row.used}</span>
                </div>
                <p className="text-xs text-gray-500">{row.help}</p>
              </div>
              <div>
                <input
                  value={values[row.code]}
                  maxLength={30}
                  onChange={(e) => setValue(row.code, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">
                    Default: {DEFAULT_STATUS_LABELS[row.code]}
                  </span>
                  {changed && (
                    <button
                      type="button"
                      onClick={() => setValue(row.code, DEFAULT_STATUS_LABELS[row.code])}
                      className="text-xs font-semibold text-blue-700"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
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
