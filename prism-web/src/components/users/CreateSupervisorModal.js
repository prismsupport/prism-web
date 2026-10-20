'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import { toast } from '@/lib/toast'

const FEATURES = [
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'advisories', label: 'Advisories' },
  { key: 'faq', label: 'FAQ' },
  { key: 'billing', label: 'Billing Requests' },
]

export default function CreateSupervisorModal({ cooperativeId, onClose, onCreated }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
  })
  const [featureAccess, setFeatureAccess] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function toggleFeature(key) {
    setFeatureAccess((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/supervisor/create-supervisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cooperativeId, ...form, featureAccess }),
    })
    const result = await res.json()

    if (!res.ok) {
      toast.error(result.error || 'Failed to create account.')
      setError(result.error || 'Failed to create account.')
      setLoading(false)
      return
    }

    toast.success('Supervisor account created')
    onCreated()
  }

  return (
    <Modal title="Create Supervisor Account" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormSection title="Supervisor Identity">
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
        </FormSection>

        <FormSection title="Connectivity">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="supervisor@utilitypro.com"
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

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Feature Access</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={featureAccess.includes(f.key)}
                  onChange={() => toggleFeature(f.key)}
                />
                {f.label}
              </label>
            ))}
          </div>
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

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-4">
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