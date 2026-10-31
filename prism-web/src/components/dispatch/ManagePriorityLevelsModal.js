'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { PriorityPill } from '@/components/ui/StatusPill'
import { toast } from '@/lib/toast'
import { DEFAULT_PRIORITY_LEVELS, useStatusLabels } from '@/lib/workflow/StatusLabelsContext'

const MIN_LEVELS = 2
const MAX_LEVELS = 6

function newKey() {
  return `p_${Math.random().toString(36).slice(2, 8)}`
}

function plain(levels) {
  return levels.map(({ key, label }) => ({ key, label }))
}

// How many tickets (of any status) still use this level
async function countUsing(supabase, key) {
  const [reportsRes, mastersRes] = await Promise.all([
    supabase
      .from('reports')
      .select('report_id', { count: 'exact', head: true })
      .eq('priority', key),
    supabase
      .from('master_tickets')
      .select('master_id', { count: 'exact', head: true })
      .eq('priority', key),
  ])
  return (reportsRes.count ?? 0) + (mastersRes.count ?? 0)
}

export default function ManagePriorityLevelsModal({ onClose, onSaved }) {
  const { priorityLevels, refresh } = useStatusLabels()
  const original = plain(priorityLevels)

  const [levels, setLevels] = useState(original)
  const [newName, setNewName] = useState('')
  const [moveNeeded, setMoveNeeded] = useState(null) // [{ key, label }]
  const [moves, setMoves] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function rename(index, text) {
    setLevels((prev) => prev.map((l, i) => (i === index ? { ...l, label: text } : l)))
  }

  function shift(index, direction) {
    const target = index + direction
    if (target < 0 || target >= levels.length) return
    setLevels((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function removeLevel(index) {
    if (levels.length <= MIN_LEVELS) {
      setError(`At least ${MIN_LEVELS} priority levels are needed.`)
      return
    }
    setError('')
    setLevels((prev) => prev.filter((_, i) => i !== index))
  }

  function addLevel() {
    const name = newName.trim()
    if (!name) return
    if (levels.length >= MAX_LEVELS) {
      setError(`You can have at most ${MAX_LEVELS} priority levels.`)
      return
    }
    if (name.length > 30) {
      setError('Names can be at most 30 characters.')
      return
    }
    if (levels.some((l) => l.label.trim().toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" already exists.`)
      return
    }
    setError('')
    setLevels((prev) => [...prev, { key: newKey(), label: name }])
    setNewName('')
  }

  function findProblem() {
    const seen = new Set()
    for (const l of levels) {
      const text = l.label.trim()
      if (!text) return 'Every level needs a name.'
      if (text.length > 30) return 'Names can be at most 30 characters.'
      if (seen.has(text.toLowerCase())) return `"${text}" is used twice. Each name must be different.`
      seen.add(text.toLowerCase())
    }
    return ''
  }

  async function persist(movesToSend) {
    setSaving(true)
    setError('')

    const supabase = createClient()
    const payload = levels.map((l) => ({ key: l.key, label: l.label.trim() }))
    const { error: saveError } = await supabase.rpc('set_priority_levels', {
      p_levels: payload,
      p_move: movesToSend,
    })

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    await refresh()
    toast.success('Priority levels updated')
    if (onSaved) onSaved()
    onClose()
  }

  async function handleSave() {
    const problem = findProblem()
    if (problem) {
      setError(problem)
      return
    }

    // Levels that existed before but were removed: do active tickets still use them?
    const removed = original.filter((o) => !levels.some((l) => l.key === o.key))
    if (removed.length === 0) {
      await persist({})
      return
    }

    setSaving(true)
    const supabase = createClient()
    const inUse = []
    for (const r of removed) {
      const count = await countUsing(supabase, r.key)
      if (count > 0) inUse.push(r)
    }
    setSaving(false)

    if (inUse.length === 0) {
      await persist({})
      return
    }

    // Default each move to the level in the same position, or the last one
    const defaults = {}
    inUse.forEach((r) => {
      const at = original.findIndex((o) => o.key === r.key)
      defaults[r.key] = levels[Math.min(at, levels.length - 1)].key
    })
    setMoves(defaults)
    setMoveNeeded(inUse)
  }

  // ----- Step 2: choose where active tickets go -----
  if (moveNeeded) {
    return (
      <Modal title="Move Tickets" onClose={onClose}>
        <p className="text-sm text-gray-500 mb-4 -mt-2">
          Tickets still use a level you removed. Choose the level they should move to. This
          includes resolved and declined tickets, so no ticket keeps a level that no longer exists.
        </p>

        <div className="space-y-3 mb-4">
          {moveNeeded.map((r) => (
            <div key={r.key} className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-900 mb-2">
                Tickets use <span className="font-semibold">&ldquo;{r.label}&rdquo;</span>. Move them to:
              </p>
              <select
                value={moves[r.key] || ''}
                onChange={(e) => setMoves((prev) => ({ ...prev, [r.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
              >
                {levels.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.label.trim() || '—'}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <Alert>{error}</Alert>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            dim={false}
            onClick={() => {
              setMoveNeeded(null)
              setError('')
            }}
            disabled={saving}
          >
            Back
          </Button>
          <Button type="button" onClick={() => persist(moves)} disabled={saving}>
            {saving ? 'Saving…' : 'Move Tickets and Save'}
          </Button>
        </div>
      </Modal>
    )
  }

  // ----- Step 1: edit the list -----
  return (
    <Modal title="Priority Levels" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        The first level is the lowest priority and the last is the highest. Colors follow the
        order. You can have {MIN_LEVELS} to {MAX_LEVELS} levels.
      </p>

      <div className="space-y-2 mb-4">
        {levels.map((l, i) => (
          <div key={l.key} className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => shift(i, -1)}
                disabled={i === 0}
                className="text-xs text-gray-500 disabled:opacity-30 leading-none px-1"
                title="Move down in priority"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => shift(i, 1)}
                disabled={i === levels.length - 1}
                className="text-xs text-gray-500 disabled:opacity-30 leading-none px-1 mt-1"
                title="Move up in priority"
              >
                ▼
              </button>
            </div>

            <input
              value={l.label}
              maxLength={30}
              onChange={(e) => rename(i, e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
            />

            <div className="w-28 flex justify-center">
              <PriorityPill label={l.label.trim() || '—'} rank={i + 1} count={levels.length} />
            </div>

            <button
              type="button"
              onClick={() => removeLevel(i)}
              className="text-xs font-semibold text-red-600 px-2"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          maxLength={30}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addLevel()
            }
          }}
          placeholder="New priority level name"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
        />
        <Button
          type="button"
          size="compact"
          dim={50}
          onClick={addLevel}
          disabled={levels.length >= MAX_LEVELS}
        >
          Add
        </Button>
      </div>

      <Alert>{error}</Alert>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setLevels(plain(DEFAULT_PRIORITY_LEVELS))
            setError('')
          }}
          className="text-sm font-semibold text-gray-600"
        >
          Reset to defaults
        </button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" dim={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Levels'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
