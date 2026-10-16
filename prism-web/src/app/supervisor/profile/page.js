'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from '@/lib/toast'

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? 'border-blue-700 text-blue-700'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function SupervisorProfilePage() {
  const fileInputRef = useRef(null)

  const [userId, setUserId] = useState(null)
  const [cooperativeName, setCooperativeName] = useState('')
  const [memberSince, setMemberSince] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '', email: '' })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeTab, setActiveTab] = useState('personal')

  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

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
      .select('first_name, last_name, phone_number, email, photo_url, cooperative_id, created_at')
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
    setAvatarUrl(myRow.photo_url || null)
    setMemberSince(myRow.created_at)

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
      toast.error(updateError.message)
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setEditing(false)
    setSuccess('Profile updated successfully.')
    toast.success('Profile updated')
  }

  async function handleAvatarSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    setAvatarError('')
    const supabase = createClient()

    const { data: existing } = await supabase.storage.from('profile_pics').list(userId)
    if (existing && existing.length > 0) {
      await supabase.storage
        .from('profile_pics')
        .remove(existing.map((f) => `${userId}/${f.name}`))
    }

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profile_pics')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error(uploadError.message)
      setAvatarError(uploadError.message)
      setAvatarUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('profile_pics').getPublicUrl(path)
    const bustCache = `${publicUrlData.publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase
      .from('users')
      .update({ photo_url: publicUrlData.publicUrl })
      .eq('id', userId)

    if (dbError) {
      toast.error(dbError.message)
      setAvatarError(dbError.message)
      setAvatarUploading(false)
      return
    }

    setAvatarUrl(bustCache)
    setAvatarUploading(false)
    toast.success('Profile photo updated')
  }

  async function handleChangeEmail(e) {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')

    if (!newEmail.trim() || newEmail.trim() === form.email) {
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
      `Confirmation links sent to both ${form.email} and ${newEmail.trim()}. Your login email updates once you confirm.`
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
      toast.success('Password updated')
      return
    }

    setPasswordSaving(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordSuccess('Password changed successfully.')
  }

  if (loading) return <PageLoading />

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Manage your personal information and account security.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:sticky lg:top-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 border border-gray-300" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center border-2 border-white"
                title="Change photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleAvatarSelected}
              />
            </div>
            {avatarUploading && (
              <p className="text-xs text-gray-400 mt-2">Uploading…</p>
            )}
            {avatarError && (
              <p className="text-xs text-red-600 mt-2">{avatarError}</p>
            )}

            <p className="text-base font-bold text-gray-900 mt-4">
              {form.first_name} {form.last_name}
            </p>
            <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded mt-1 uppercase">
              Supervisor
            </span>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Cooperative</p>
              <p className="text-gray-900 font-medium">{cooperativeName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Supervisor Since</p>
              <p className="text-gray-900 font-medium">
                {memberSince
                  ? new Date(memberSince).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <div className="flex gap-6 border-b border-gray-200 mb-6">
            <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')}>
              Personal Information
            </TabButton>
            <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
              Security
            </TabButton>
          </div>

          {activeTab === 'personal' && (
            <Card>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">Personal Details</h2>
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

              <FormSection title="Basic Information">
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
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <h2 className="font-semibold text-gray-900 text-sm mb-1">Login Email</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Current: <span className="font-medium text-gray-700">{form.email}</span>
                </p>
                <form onSubmit={handleChangeEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new-email@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  {emailError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {emailError}
                    </p>
                  )}
                  {emailSuccess && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      {emailSuccess}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={emailSaving}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
                    >
                      {emailSaving ? 'Sending…' : 'Update Email'}
                    </button>
                  </div>
                </form>
              </Card>

              <Card>
                <h2 className="font-semibold text-gray-900 text-sm mb-3">Change Password</h2>
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
          )}
        </div>
      </div>
    </div>
  )
}