'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/lib/supervisor/PermissionsContext'
import { toast } from '@/lib/toast'

const HOTLINE_PATTERN = /^[0-9+()\/,.\s-]{3,60}$/

// Shown inside Manage Area Offices. The owner edits; other supervisors see them.
export default function AreaOfficeHotlines({ areaOffices }) {
  const { isOwner } = usePermissions()
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data, error: loadError } = await supabase.rpc('get_office_settings')
    if (loadError) {
      setError(loadError.message)
    } else {
      setValues(data?.hotlines || {})
    }
    setLoading(false)
  }

  async function handleSave() {
    const payload = {}
    for (const office of areaOffices) {
      const text = (values[office] || '').trim()
      if (text && !HOTLINE_PATTERN.test(text)) {
        setError(`"${office}": use only digits, spaces and + ( ) - / , . (3 to 60 characters).`)
        return
      }
      payload[office] = text
    }

    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data, error: saveError } = await supabase.rpc('set_area_office_hotlines', {
      p_hotlines: payload,
    })

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    setValues(data || {})
    setSaving(false)
    toast.success('Hotlines saved')
  }

  if (areaOffices.length === 0) return null

  return (
    <div className="border-t border-gray-100 mt-5 pt-4">
      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Hotlines</p>
      <p className="text-xs text-gray-400 mb-3">
        Consumers see their area office&apos;s hotline when reports are closed outside office hours.
        Each office has one field; enter multiple numbers separated by / or commas.
        {!isOwner && ' Only the cooperative owner can change hotlines.'}
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {areaOffices.map((office) => (
            <div key={office} className="flex items-center gap-3">
              <span className="w-1/2 text-sm text-gray-900 truncate" title={office}>
                {office}
              </span>
              {isOwner ? (
                <input
                  value={values[office] || ''}
                  maxLength={60}
                  onChange={(e) => setValues((prev) => ({ ...prev, [office]: e.target.value }))}
                  placeholder="e.g. 0917 123 4567"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                />
              ) : (
                <span className="flex-1 text-sm text-gray-600">
                  {values[office] || 'No hotline set'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
          {error}
        </p>
      )}

      {isOwner && !loading && (
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Hotlines'}
          </button>
        </div>
      )}
    </div>
  )
}