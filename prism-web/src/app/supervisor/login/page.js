'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LoginForm from '@/components/ui/LoginForm'

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

    // Review the user's row to find their cooperative and active status
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

    router.push('/supervisor/dashboard')
  }

    return (
    <LoginForm
      logoSubtitle="SUPERVISOR PORTAL"
      title="Supervisor Portal"
      description="Sign in with your registered account."
      emailPlaceholder="supervisor@gmail.com"
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      error={error}
      loading={loading}
      onSubmit={handleLogin}
      footer={
        <p className="text-center text-sm text-gray-500">
          Not yet registered?{' '}
          <a href="/supervisor/register" className="text-blue-700 font-medium">
            Register Now
          </a>
        </p>
      }
    />
  )
}