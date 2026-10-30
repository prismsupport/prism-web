'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '@/components/ui/AuthLayout'
import { toast } from '@/lib/toast'
import TermsModal from '@/components/ui/TermsModal'
import PrivacyPolicyModal from '@/components/ui/PrivacyPolicyModal'

export default function SupervisorRegisterPage() {
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
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
    if (!agreed) {
      setError('You must agree to the Terms and Conditions and the Privacy Policy to register.')
      return
    }
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Step 1: create the real Supabase Auth account (sends confirmation email)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      toast.error(signUpError.message)
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
      toast.error(result.error || 'Registration failed.')
      setError(result.error || 'Registration failed.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
    toast.success('Registration submitted')
  }

  if (submitted) {
    return (
      <AuthLayout logoSubtitle="SUPERVISOR PORTAL">
        <div className="text-center lg:text-left">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 lg:mx-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Registration submitted</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Please check <span className="font-semibold text-gray-700">{form.email}</span> to
            confirm your account. After confirming, your registration will be under review by
            the Superadmin — you'll be able to log in once it's approved.
          </p>
          <a
            href="/supervisor/login"
            className="mt-8 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Back to log in
          </a>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout logoSubtitle="SUPERVISOR PORTAL" wide>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Register your cooperative
          </h1>
          <p className="mb-8 mt-2 text-sm text-gray-500">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  name="officeAddress"
                  required
                  value={form.officeAddress}
                  onChange={handleChange}
                  placeholder="Office Address"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="municipality"
                    required
                    value={form.municipality}
                    onChange={handleChange}
                    placeholder="Municipality"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    name="province"
                    required
                    value={form.province}
                    onChange={handleChange}
                    placeholder="Province"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <input
                  name="contactNumber"
                  required
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="Contact Number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  name="officialEmail"
                  type="email"
                  required
                  value={form.officialEmail}
                  onChange={handleChange}
                  placeholder="Official Cooperative Email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    name="lastName"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your Personal Email (for login)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5"
              />
              <span>
                I confirm that I am an authorized representative of this cooperative and I
                agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-blue-700 font-medium underline"
                >
                  Terms and Conditions
                </button>{' '}
                and the{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-blue-700 font-medium underline"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !agreed}
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
          {showTerms && (
            <TermsModal
              onClose={() => setShowTerms(false)}
              onAccept={() => {
                setAgreed(true)
                setShowTerms(false)
              }}
            />
          )}
          {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
    </AuthLayout>
  )
}