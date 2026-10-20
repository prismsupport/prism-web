'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LoginForm from '@/components/ui/LoginForm'
import { toast } from '@/lib/toast'

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
      toast.error('Invalid email or password.')
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
      toast.error('This account is not authorized as Superadmin.')
      setError('This account is not authorized as Superadmin.')
      setLoading(false)
      return
    }

    toast.success('Signed in successfully')
    router.push('/superadmin/cooperatives')
  }

  return (
    <LoginForm
      logoSubtitle="SUPERADMIN DASHBOARD"
      title="Welcome Back!"
      description="Sign in with your platform administrator account."
      emailPlaceholder="superadmin@prism.com"
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      error={error}
      loading={loading}
      onSubmit={handleLogin}
    />
  )
}