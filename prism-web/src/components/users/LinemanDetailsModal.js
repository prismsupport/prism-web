'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import StatusDot from '@/components/ui/StatusDot'

export default function LinemanDetailsModal({ lineman, areaOffices, onClose, onToggleActive, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    first_name: lineman.first_name,
    last_name: lineman.last_name,
    email: lineman.email,
    phone_number: lineman.phone_number,
    assigned_area_office: lineman.assigned_area_office || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { first_name, last_name, email, phone_number, assigned_area_office } = form

    const { error: userError } = await supabase
      .from('users')
      .update({ first_name, last_name, email, phone_number })
      .eq('id', lineman.id)

    if (userError) {
      setError(userError.message)
      setSaving(false)
      return
    }

    const { error: linemanError } = await supabase
      .from('lineman')
      .update({ assigned_area_office })
      .eq('profile_id', lineman.id)

    if (linemanError) {
      setError(linemanError.message)
      setSaving(false)
      return
    }

    onSaved()
  }

  return (
    <Modal title="Lineman Details" onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <StatusDot isActive={lineman.is_active} />
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      <FormSection title="Lineman Identity">
        <FormField
          label="First Name"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          disabled={!editing}
        />
        <FormField
          label="Last Name"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          disabled={!editing}
        />
        <FormField
          label="Company ID Number"
          value={lineman.company_id_number || '—'}
          disabled
        />
      </FormSection>

      <FormSection title="Connectivity">
        <FormField
          label="Email Address"
          name="email"
          value={form.email}
          onChange={handleChange}
          disabled={!editing}
        />
        <FormField
          label="Contact Number"
          name="phone_number"
          value={form.phone_number}
          onChange={handleChange}
          disabled={!editing}
        />
      </FormSection>

      <FormSection title="System Access">
        {editing ? (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Assigned Area Office
            </label>
            <select
              name="assigned_area_office"
              value={form.assigned_area_office}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
            >
              <option value="">Select an area</option>
              {areaOffices.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
        ) : (
          <FormField
            label="Assigned Area Office"
            value={lineman.assigned_area_office || '—'}
            disabled
          />
        )}
      </FormSection>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {editing ? (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => onToggleActive(lineman.id, lineman.is_active)}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            lineman.is_active
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-blue-700 hover:bg-blue-800 text-white'
          }`}
        >
          {lineman.is_active ? 'Deactivate Account' : 'Reactivate Account'}
        </button>
      )}
    </Modal>
  )
}