'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import StatusDot from '@/components/ui/StatusDot'
import ShiftScheduleEditor from '@/components/users/ShiftScheduleEditor'
import { validateSchedule, cleanSchedule } from '@/lib/lineman/schedule'
import { toast } from "@/lib/toast"

function copySchedule(schedule) {
  return (schedule || []).map((b) => ({ ...b, days: [...b.days] }))
}

export default function LinemanDetailsModal({ lineman, areaOffices, onClose, onToggleActive, onSaved }) {
  const originalForm = {
    first_name: lineman.first_name,
    last_name: lineman.last_name,
    email: lineman.email,
    phone_number: lineman.phone_number,
    assigned_area_office: lineman.assigned_area_office || '',
  }

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(originalForm)
  const [schedule, setSchedule] = useState(() => copySchedule(lineman.schedule))
  const [overrideHours, setOverrideHours] = useState(2)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const overrideActive =
    lineman.duty_override_until && new Date(lineman.duty_override_until) > new Date()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleCancelEdit() {
    setForm(originalForm)
    setSchedule(copySchedule(lineman.schedule))
    setError('')
    setEditing(false)
  }

  async function handleSave() {
    setError('')

    const scheduleError = validateSchedule(schedule)
    if (scheduleError) {
      setError(scheduleError)
      return
    }

    setSaving(true)
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
      .update({ assigned_area_office, schedule: cleanSchedule(schedule) })
      .eq('profile_id', lineman.id)

    if (linemanError) {
      setError(linemanError.message)
      setSaving(false)
      return
    }

    toast.success("Lineman details saved")

    onSaved()
  }

  // hours = number sets on-call for that many hours; null clears it
  async function saveOverride(hours) {
    setSaving(true)
    setError('')
    const supabase = createClient()

    const until = hours ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null

    const { error: overrideError } = await supabase
      .from('lineman')
      .update({ duty_override_until: until })
      .eq('profile_id', lineman.id)

    if (overrideError) {
      setError(overrideError.message)
      setSaving(false)
      return
    }

    toast.success(hours ? `On-call set for ${hours} hours` : "On-call cleared")
    
    onSaved()
  }

  return (
    <Modal title="Lineman Details" onClose={onClose} size="xxl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <StatusDot isActive={lineman.is_active} />
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
              <div className="col-span-2">
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
              <div className="col-span-2">
                <FormField
                  label="Assigned Area Office"
                  value={lineman.assigned_area_office || '—'}
                  disabled
                />
              </div>
            )}
          </FormSection>
        </div>

        <div className="min-w-0">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Duty Schedule</h3>
            </div>
            <ShiftScheduleEditor value={schedule} onChange={setSchedule} disabled={!editing} />
          </div>

          {!editing && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">On-Call Override</h3>
              </div>

              {overrideActive ? (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <p className="text-sm text-amber-800">
                    On call until{' '}
                    {new Date(lineman.duty_override_until).toLocaleString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => saveOverride(null)}
                    disabled={saving}
                    className="text-xs font-semibold text-amber-800 disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={overrideHours}
                    onChange={(e) => setOverrideHours(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                  >
                    <option value={2}>2 hours</option>
                    <option value={4}>4 hours</option>
                    <option value={8}>8 hours</option>
                    <option value={12}>12 hours</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => saveOverride(overrideHours)}
                    disabled={saving}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
                  >
                    Set On-Call
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                For emergencies: lets this lineman use the app and count as on duty outside
                their shift.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {editing ? (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancelEdit}
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
        <div className="flex gap-3">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onToggleActive(lineman.id, lineman.is_active)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              lineman.is_active
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
          >
            {lineman.is_active ? 'Deactivate Account' : 'Reactivate Account'}
          </button>
        </div>
      )}
    </Modal>
  )
}