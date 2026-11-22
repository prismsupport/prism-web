'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import InlineLoading from '@/components/ui/InlineLoading'
import { PriorityPill } from '@/components/ui/StatusPill'
import { ISSUE_LABELS } from '@/lib/issueCodes'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import { toast } from '@/lib/toast'

export default function CategoryPrioritiesModal({ onClose }) {
  const { priorityLevels } = useStatusLabels()
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: loadError } = await supabase
        .from('cooperative_settings')
        .select('category_priorities')
        .maybeSingle()

      if (loadError) {
        setError(loadError.message)
        setLoading(false)
        return
      }

      // Ignore any saved level that no longer exists in the cooperative's list
      const saved = data?.category_priorities || {}
      const clean = {}
      Object.keys(ISSUE_LABELS).forEach((code) => {
        clean[code] = priorityLevels.some((l) => l.key === saved[code]) ? saved[code] : ''
      })
      setValues(clean)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')

    const payload = {}
    Object.entries(values).forEach(([code, key]) => {
      if (key) payload[code] = key
    })

    const supabase = createClient()
    const { error: saveError } = await supabase.rpc('set_category_priorities', { p_map: payload })

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    toast.success('Category priorities saved')
    onClose()
  }

  return (
    <Modal title="Category Priorities" onClose={onClose} size="xl">
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Choose the priority that new reports get automatically, based on the category the consumer
        picked. A category left as Not set gets no priority, and you can still change any ticket's
        priority yourself when you assign a lineman. This applies to new reports only.
      </p>

      {loading ? (
        <InlineLoading />
      ) : (
        <div className="space-y-2 mb-4">
          {Object.entries(ISSUE_LABELS).map(([code, label]) => {
            const index = priorityLevels.findIndex((l) => l.key === values[code])
            return (
              <div
                key={code}
                className="flex items-center gap-3 border border-gray-200 rounded-lg p-2.5"
              >
                <p className="flex-1 text-sm font-medium text-gray-900">{label}</p>
                <select
                  value={values[code] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [code]: e.target.value }))}
                  aria-label={`Priority for ${label}`}
                  className="w-40 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                >
                  <option value="">Not set</option>
                  {priorityLevels.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div className="w-28 flex justify-center">
                  {index >= 0 ? (
                    <PriorityPill
                      label={priorityLevels[index].label}
                      rank={index + 1}
                      count={priorityLevels.length}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Not set</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Alert>{error}</Alert>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setValues(Object.fromEntries(Object.keys(ISSUE_LABELS).map((c) => [c, ''])))
          }
          className="text-sm font-semibold text-gray-600"
        >
          Clear all
        </button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" dim={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save Priorities'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}