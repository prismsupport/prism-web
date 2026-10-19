'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import DutyDaysPicker from '@/components/users/DutyDaysPicker'
import { toast } from '@/lib/toast'

const NEW_BLOCK = { days: [1, 2, 3, 4, 5], start: '08:00', end: '17:00' }
const MAX_BLOCKS = 7

export default function OfficeHoursModal({ onClose }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [blocks, setBlocks] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data, error: loadError } = await supabase.rpc('get_office_settings')

    if (loadError) {
      setError(loadError.message)
      setLoading(false)
      return
    }

    const config = data?.office_hours || {}
    setEnabled(!!config.enabled)
    setBlocks((config.blocks || []).map((b) => ({ days: [...b.days], start: b.start, end: b.end })))
    setLoading(false)
  }

  function updateBlock(index, changes) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...changes } : b)))
  }

  function addBlock() {
    if (blocks.length >= MAX_BLOCKS) return
    setBlocks((prev) => [...prev, { ...NEW_BLOCK, days: [...NEW_BLOCK.days] }])
  }

  function removeBlock(index) {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleEnabled(on) {
    setEnabled(on)
    if (on && blocks.length === 0) addBlock()
  }

  function findProblem() {
    if (enabled && blocks.length === 0) {
      return 'Add at least one time block, or switch office hours off.'
    }
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]
      if (b.days.length === 0) return `Block ${i + 1}: pick at least one day.`
      if (!b.start || !b.end) return `Block ${i + 1}: set a start and end time.`
      if (b.start === b.end) return `Block ${i + 1}: start and end time cannot be the same.`
    }
    return ''
  }

  async function handleSave() {
    const problem = findProblem()
    if (problem) {
      setError(problem)
      return
    }

    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: saveError } = await supabase.rpc('set_office_hours', {
      p_config: {
        enabled,
        blocks: blocks.map((b) => ({
          days: [...b.days].sort((x, y) => x - y),
          start: b.start.slice(0, 5),
          end: b.end.slice(0, 5),
        })),
      },
    })

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    toast.success('Office hours saved')
    onClose()
  }

  return (
    <Modal title="Office Hours" onClose={onClose} size="xl">
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4 -mt-2">
            When this is on, consumers can submit new outage reports only during these hours.
            Outside them, the consumer app shows the hotline of their area office instead. Times
            are Philippine time.
          </p>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => toggleEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-semibold text-gray-800">
              Only accept new reports during office hours
            </span>
          </label>

          {!enabled && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">
              Switched off: consumers can submit reports at any time.
            </p>
          )}

          <div className={`space-y-3 mb-4 ${enabled ? '' : 'opacity-50'}`}>
            {blocks.length === 0 && (
              <p className="text-sm text-gray-500">No office hours added yet.</p>
            )}

            {blocks.map((block, i) => {
              const overnight = block.start && block.end && block.end < block.start
              return (
                <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Opens</label>
                      <input
                        type="time"
                        value={block.start}
                        onChange={(e) => updateBlock(i, { start: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Closes</label>
                      <input
                        type="time"
                        value={block.end}
                        onChange={(e) => updateBlock(i, { end: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                      />
                    </div>
                  </div>

                  {overnight && (
                    <p className="text-xs text-gray-500 mb-2">
                      Overnight block: it belongs to the day it opens and closes the next morning.
                    </p>
                  )}

                  <p className="text-xs font-medium text-gray-500 mb-1.5">Open on</p>
                  <div className="flex items-center justify-between gap-3">
                    <DutyDaysPicker
                      value={block.days}
                      onChange={(days) => updateBlock(i, { days })}
                    />
                    <button
                      type="button"
                      onClick={() => removeBlock(i)}
                      className="text-xs font-semibold text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}

            {blocks.length < MAX_BLOCKS && (
              <button
                type="button"
                onClick={addBlock}
                className="text-sm text-blue-700 font-medium"
              >
                + Add Time Block
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Office Hours'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}