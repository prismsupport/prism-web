'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'

export default function SupervisorLoginPage() {
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
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Look up this user's row to find their cooperative and active status
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('cooperative_id, is_active, user_type')
      .eq('id', data.user.id)
      .single()

    if (userError || !userRow || userRow.user_type !== 'supervisor') {
      await supabase.auth.signOut()
      setError('This account is not registered as a Supervisor.')
      setLoading(false)
      return
    }

    // Check the linked cooperative's status before granting dashboard access
    const { data: coop, error: coopError } = await supabase
      .from('cooperatives')
      .select('status, rejection_reason')
      .eq('id', userRow.cooperative_id)
      .single()

    if (coopError || !coop) {
      await supabase.auth.signOut()
      setError('Unable to verify your cooperative status.')
      setLoading(false)
      return
    }

    if (coop.status === 'Pending Approval') {
      await supabase.auth.signOut()
      setError(
        'Your cooperative registration is still under review by the Superadmin.'
      )
      setLoading(false)
      return
    }

    if (coop.status === 'Rejected') {
      await supabase.auth.signOut()
      setError(
        `Your cooperative registration was rejected. Reason: ${
          coop.rejection_reason || 'No reason provided.'
        }`
      )
      setLoading(false)
      return
    }

    if (coop.status === 'Deactivated') {
      await supabase.auth.signOut()
      setError(
        'Your cooperative account has been deactivated. Contact the Superadmin for assistance.'
      )
      setLoading(false)
      return
    }

    // status === 'Active' — real access granted
    router.push('/supervisor/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100">
          <Logo subtitle="SUPERVISOR PORTAL" />
        </div>

        <div className="px-8 pt-8 pb-10">
          <h1 className="text-2xl font-bold text-gray-900">Supervisor Portal</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Sign in with your registered account.
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
                placeholder="supervisor@gmail.com"
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
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
            >
              {loading ? 'Signing in…' : 'Log In'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Not yet registered?{' '}
              <a href="/supervisor/register" className="text-blue-700 font-medium">
                Register Now
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}