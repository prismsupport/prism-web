'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'

export default function SupervisorProfilePage() {
  const [userId, setUserId] = useState(null)
  const [cooperativeName, setCooperativeName] = useState('')
  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '', email: '' })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Unable to load your account.')
      setLoading(false)
      return
    }

    setUserId(user.id)

    const { data: myRow, error: myRowError } = await supabase
      .from('users')
      .select('first_name, last_name, phone_number, email, cooperative_id')
      .eq('id', user.id)
      .single()

    if (myRowError || !myRow) {
      setError('Unable to load your profile.')
      setLoading(false)
      return
    }

    setForm({
      first_name: myRow.first_name || '',
      last_name: myRow.last_name || '',
      phone_number: myRow.phone_number || '',
      email: myRow.email || '',
    })

    if (myRow.cooperative_id) {
      const { data: coop } = await supabase
        .from('cooperatives')
        .select('cooperative_name')
        .eq('id', myRow.cooperative_id)
        .single()
      if (coop) setCooperativeName(coop.cooperative_name)
    }

    setLoading(false)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setEditing(false)
    setSuccess('Profile updated successfully.')
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
      setPasswordError(passwordUpdateError.message)
      setPasswordSaving(false)
      return
    }

    setPasswordSaving(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordSuccess('Password changed successfully.')
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal information and account security.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 border border-gray-300" />
            <div>
              <p className="text-base font-semibold text-gray-900">
                {form.first_name} {form.last_name}
              </p>
              <p className="text-sm text-gray-500">{cooperativeName || 'Supervisor'}</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => {
                setEditing(true)
                setSuccess('')
              }}
              className="text-xs font-semibold text-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        <FormSection title="Personal Information">
          <FormField
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            disabled={!editing}
          />
          <FormField
            label="Last Name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            disabled={!editing}
          />
          <FormField
            label="Contact Number"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            disabled={!editing}
          />
          <FormField label="Email Address" value={form.email} disabled />
        </FormSection>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4">
            {success}
          </p>
        )}

        {editing && (
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditing(false)
                loadProfile()
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-gray-900 text-sm mb-3 pb-2 border-b border-gray-100">
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          {passwordError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {passwordSuccess}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
            >
              {passwordSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}