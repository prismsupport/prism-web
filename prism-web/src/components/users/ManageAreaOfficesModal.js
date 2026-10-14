'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'

export default function ManageAreaOfficesModal({ cooperativeId, areaOffices, onClose, onUpdated }) {
  const [list, setList] = useState(areaOffices || [])
  const [newArea, setNewArea] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Removal flow: which office is being removed, what uses it, where to move it
  const [removing, setRemoving] = useState(null)
  const [usage, setUsage] = useState(null)
  const [checking, setChecking] = useState(false)
  const [moveTo, setMoveTo] = useState('')

  // Safe numbers: 0 until the check has finished
  const linemenCount = usage?.linemen ?? 0
  const serviceAreaCount = usage?.serviceAreas ?? 0
  const inUse = linemenCount > 0 || serviceAreaCount > 0

  async function persist(updatedList) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('cooperative_settings')
      .update({ area_offices: updatedList })
      .eq('cooperative_id', cooperativeId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return false
    }

    setList(updatedList)
    onUpdated(updatedList)
    setSaving(false)
    return true
  }

  function handleAdd() {
    const trimmed = newArea.trim()
    if (!trimmed || list.includes(trimmed)) return
    persist([...list, trimmed])
    setNewArea('')
  }

  async function startRemove(area) {
    setError('')
    setRemoving(area)
    setUsage(null)
    setMoveTo('')
    setChecking(true)

    const supabase = createClient()
    const [linemenRes, areasRes] = await Promise.all([
      supabase
        .from('lineman')
        .select('profile_id', { count: 'exact', head: true })
        .eq('assigned_area_office', area),
      supabase
        .from('service_areas')
        .select('id', { count: 'exact', head: true })
        .eq('cooperative_id', cooperativeId)
        .eq('area_office', area),
    ])

    const checkError = linemenRes.error || areasRes.error
    if (checkError) {
      setError(`Could not check what uses this area office. (${checkError.message})`)
      setRemoving(null)
      setChecking(false)
      return
    }

    setUsage({ linemen: linemenRes.count ?? 0, serviceAreas: areasRes.count ?? 0 })
    setChecking(false)
  }

  function cancelRemove() {
    setRemoving(null)
    setUsage(null)
    setMoveTo('')
  }

  async function confirmRemove() {
    if (!removing || !usage) return

    setSaving(true)
    setError('')
    const supabase = createClient()
    const target = moveTo || null

    // Move everything first, so nothing is ever left pointing at a removed office
    if (linemenCount > 0) {
      const { error: linemenError } = await supabase
        .from('lineman')
        .update({ assigned_area_office: target })
        .eq('assigned_area_office', removing)
      if (linemenError) {
        setError(linemenError.message)
        setSaving(false)
        return
      }
    }

    if (serviceAreaCount > 0) {
      const { error: areasError } = await supabase
        .from('service_areas')
        .update({ area_office: target })
        .eq('cooperative_id', cooperativeId)
        .eq('area_office', removing)
      if (areasError) {
        setError(areasError.message)
        setSaving(false)
        return
      }
    }

    const ok = await persist(list.filter((a) => a !== removing))
    if (ok) cancelRemove()
    setSaving(false)
  }

  return (
    <Modal title="Manage Area Offices" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {list.length === 0 && <p className="text-sm text-gray-500">No area offices yet.</p>}
        {list.map((area) => (
          <div
            key={area}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200"
          >
            <span className="text-sm text-gray-900">{area}</span>
            <button
              onClick={() => startRemove(area)}
              disabled={saving || checking || !!removing}
              className="text-xs font-semibold text-red-600 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {removing && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">Remove "{removing}"?</p>

          {checking && (
            <p className="text-sm text-gray-500">Checking what uses this area office…</p>
          )}

          {!checking && usage && !inUse && (
            <p className="text-sm text-gray-700">Nothing is assigned to this area office.</p>
          )}

          {!checking && usage && inUse && (
            <>
              <p className="text-sm text-gray-700 mb-3">
                {linemenCount} lineman(s) and {serviceAreaCount} service area(s) are assigned to it.
                If it were removed without moving them, they would point at an area office that no
                longer exists, and those linemen would stop matching the areas they cover in
                dispatch recommendations.
              </p>
              <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
                MOVE THEM TO
              </label>
              <select
                value={moveTo}
                onChange={(e) => setMoveTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
              >
                <option value="">Leave unassigned</option>
                {list
                  .filter((a) => a !== removing)
                  .map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
              </select>
            </>
          )}

          {!checking && usage && (
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={cancelRemove}
                disabled={saving}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={saving}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? 'Working…' : inUse ? 'Move and remove' : 'Remove'}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={newArea}
          onChange={(e) => setNewArea(e.target.value)}
          placeholder="New area office name"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
        >
          Add
        </button>
      </div>
    </Modal>
  )
}