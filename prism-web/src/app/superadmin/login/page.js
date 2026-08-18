'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'

export default function SuperadminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    const loggedInUserId = data.user.id

    const res = await fetch('/api/superadmin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: loggedInUserId }),
    })
    const result = await res.json()

    if (!result.isSuperadmin) {
      await supabase.auth.signOut()
      setError('This account is not authorized as Superadmin.')
      setLoading(false)
      return
    }

    router.push('/superadmin/cooperatives')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100">
          <Logo subtitle="SUPERADMIN DASHBOARD" />
        </div>

        <div className="px-8 pt-8 pb-10">
          <h1 className="text-2xl font-bold text-gray-900">Superadmin Login</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Sign in with your platform administrator account.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-wide text-blue-700 mb-1.5">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@prism.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-blue-700 mb-1.5">
                PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Signing in…' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}