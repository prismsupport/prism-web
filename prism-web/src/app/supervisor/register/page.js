'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '@/components/ui/AuthLayout'
import AuthInput from '@/components/ui/AuthInput'
import Alert from '@/components/ui/Alert'
import { toast } from '@/lib/toast'

export default function SupervisorRegisterPage() {
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

  // Shared props for every register-form input
  function field(name, placeholder, extra = {}) {
    return {
      name,
      required: true,
      value: form[name],
      onChange: handleChange,
      placeholder,
      ...extra,
    }
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
      <h1 className="text-3xl font-extrabold text-gray-900">Register your cooperative</h1>
      <p className="mb-8 mt-2 text-sm text-gray-500">
        Create your cooperative profile and administrator account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-xs font-bold tracking-wide text-blue-700 mb-3">
            COOPERATIVE INFORMATION
          </h2>
          <div className="space-y-3">
            <AuthInput {...field('cooperativeName', 'Cooperative Name')} />
            <AuthInput {...field('officeAddress', 'Office Address')} />
            <div className="grid grid-cols-2 gap-3">
              <AuthInput {...field('municipality', 'Municipality')} />
              <AuthInput {...field('province', 'Province')} />
            </div>
            <AuthInput {...field('contactNumber', 'Contact Number')} />
            <AuthInput {...field('officialEmail', 'Official Cooperative Email', { type: 'email' })} />
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold tracking-wide text-blue-700 mb-3">
            ADMINISTRATOR ACCOUNT
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <AuthInput {...field('firstName', 'First Name')} />
              <AuthInput {...field('lastName', 'Last Name')} />
            </div>
            <AuthInput {...field('email', 'Your Personal Email (for login)', { type: 'email' })} />
            <AuthInput {...field('password', 'Password', { type: 'password', minLength: 6 })} />
          </div>
        </div>

        <Alert className="">{error}</Alert>

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
    </AuthLayout>
  )
}
