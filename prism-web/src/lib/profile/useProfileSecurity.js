'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

// Owns the Security tab state: change login email and change password.
// currentEmail = the email currently shown on the profile (form.email on the page).
export function useProfileSecurity(currentEmail) {
  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  async function handleChangeEmail(e) {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')

    if (!newEmail.trim() || newEmail.trim() === currentEmail) {
      setEmailError('Enter a different email address.')
      return
    }

    setEmailSaving(true)
    const supabase = createClient()
    const { error: emailUpdateError } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    })

    if (emailUpdateError) {
      toast.error(emailUpdateError.message)
      setEmailError(emailUpdateError.message)
      setEmailSaving(false)
      return
    }

    setEmailSaving(false)
    setNewEmail('')
    setEmailSuccess(
      `Confirmation links sent to both ${currentEmail} and ${newEmail.trim()}. Your login email updates once you confirm.`
    )
    toast.success('Email confirmation links sent')
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordSaving(true)
    const supabase = createClient()
    const { error: passwordUpdateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (passwordUpdateError) {
      toast.error(passwordUpdateError.message)
      setPasswordError(passwordUpdateError.message)
      setPasswordSaving(false)
      return
    }

    setPasswordSaving(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordSuccess('Password changed successfully.')
    toast.success('Password updated')
  }

  return {
    newEmail,
    setNewEmail,
    emailSaving,
    emailError,
    emailSuccess,
    handleChangeEmail,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordSaving,
    passwordError,
    passwordSuccess,
    handleChangePassword,
  }
}