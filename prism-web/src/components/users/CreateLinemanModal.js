'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import ShiftScheduleEditor from '@/components/users/ShiftScheduleEditor'
import { validateSchedule, cleanSchedule } from '@/lib/lineman/schedule'

export default function CreateLinemanModal({ cooperativeId, areaOffices, onManageAreas, onClose, onCreated }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyIdNumber: '',
    email: '',
    contactNumber: '',
    assignedAreaOffice: '',
    password: '',
  })
  const [schedule, setSchedule] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const scheduleError = validateSchedule(schedule)
    if (scheduleError) {
      setError(scheduleError)
      return
    }

    setLoading(true)

    const res = await fetch('/api/supervisor/create-lineman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cooperativeId, ...form, schedule: cleanSchedule(schedule) }),
    })
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Failed to create account.')
      setLoading(false)
      return
    }

    onCreated()
  }

  return (
    <Modal title="Create Lineman Account" onClose={onClose} size="xl">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <FormSection title="Lineman Identity">
              <FormField
                label="First Name"
                name="firstName"
                required
                placeholder="First name"
                value={form.firstName}
                onChange={handleChange}
              />
              <FormField
                label="Last Name"
                name="lastName"
                required
                placeholder="Last name"
                value={form.lastName}
                onChange={handleChange}
              />
              <FormField
                label="Company ID Number"
                name="companyIdNumber"
                placeholder="UT-XXXX-2024"
                value={form.companyIdNumber}
                onChange={handleChange}
              />
            </FormSection>

            <FormSection title="Connectivity">
              <FormField
                label="Email Address"
                name="email"
                type="email"
                required
                placeholder="tech@utilitypro.com"
                value={form.email}
                onChange={handleChange}
              />
              <FormField
                label="Contact Number"
                name="contactNumber"
                required
                placeholder="+63 900 000 0000"
                value={form.contactNumber}
                onChange={handleChange}
              />
            </FormSection>

            <FormSection title="System Access">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Assigned Area Office
                </label>
                <select
                  name="assignedAreaOffice"
                  required
                  value={form.assignedAreaOffice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                >
                  <option value="">Select an area</option>
                  {areaOffices.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onManageAreas}
                  className="text-xs text-blue-700 font-medium mt-1"
                >
                  Manage area offices
                </button>
              </div>
              <FormField
                label="Initial Password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </FormSection>
          </div>

          <div className="min-w-0">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Duty Schedule</h3>
                <span className="text-xs text-gray-400">(optional)</span>
              </div>
              <ShiftScheduleEditor value={schedule} onChange={setSchedule} />
            </div>
          </div>
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
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  )
}