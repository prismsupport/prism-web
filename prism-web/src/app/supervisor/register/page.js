'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'

export default function SupervisorRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    cooperativeName: '',
    officeAddress: '',
    municipality: '',
    province: '',
    contactNumber: '',
    officialEmail: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Step 1: create the real Supabase Auth account (sends confirmation email)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Step 2: insert the cooperative + supervisor rows via server route, since the user has no active session yet (email not confirmed).
    const res = await fetch('/api/supervisor/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.user.id,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        contactNumber: form.contactNumber,
        cooperativeName: form.cooperativeName,
        officeAddress: form.officeAddress,
        municipality: form.municipality,
        province: form.province,
        officialEmail: form.officialEmail,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Registration failed.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100">
            <Logo subtitle="SUPERVISOR PORTAL" />
          </div>
          <div className="px-8 py-10 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Registration Submitted
            </h1>
            <p className="text-sm text-gray-500">
              Please check <span className="font-medium">{form.email}</span> to
              confirm your account. After confirming, your registration will
              be under review by the Superadmin — you'll be able to log in
              once it's approved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100">
          <Logo subtitle="SUPERVISOR PORTAL" />
        </div>

        <div className="px-8 pt-8 pb-10">
          <h1 className="text-2xl font-bold text-gray-900">
            Register Your Cooperative
          </h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Create your cooperative profile and administrator account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-xs font-bold tracking-wide text-blue-700 mb-3">
                COOPERATIVE INFORMATION
              </h2>
              <div className="space-y-3">
                <input
                  name="cooperativeName"
                  required
                  value={form.cooperativeName}
                  onChange={handleChange}
                  placeholder="Cooperative Name"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  name="officeAddress"
                  required
                  value={form.officeAddress}
                  onChange={handleChange}
                  placeholder="Office Address"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="municipality"
                    required
                    value={form.municipality}
                    onChange={handleChange}
                    placeholder="Municipality"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    name="province"
                    required
                    value={form.province}
                    onChange={handleChange}
                    placeholder="Province"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <input
                  name="contactNumber"
                  required
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="Contact Number"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  name="officialEmail"
                  type="email"
                  required
                  value={form.officialEmail}
                  onChange={handleChange}
                  placeholder="Official Cooperative Email"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xs font-bold tracking-wide text-blue-700 mb-3">
                ADMINISTRATOR ACCOUNT
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="firstName"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    name="lastName"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your Personal Email (for login)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
            >
              {loading ? 'Submitting…' : 'Register'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already registered?{' '}
              <a href="/supervisor/login" className="text-blue-700 font-medium">
                Log in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}