'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from '@/lib/toast'
import { usePermissions } from '@/lib/supervisor/PermissionsContext'
import { useProfileAvatar } from '@/lib/profile/useProfileAvatar'
import { useProfileSecurity } from '@/lib/profile/useProfileSecurity'
import CooperativeLogoUploader from '@/components/cooperative/CooperativeLogoUploader'
import ProfileSummaryCard from '@/components/profile/ProfileSummaryCard'
import PersonalInfoTab from '@/components/profile/PersonalInfoTab'
import SecurityTab from '@/components/profile/SecurityTab'

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
  const [userId, setUserId] = useState(null)
  const [cooperativeName, setCooperativeName] = useState('')
  const [memberSince, setMemberSince] = useState(null)
  const { isOwner, featureAccess } = usePermissions()

  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '', email: '' })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeTab, setActiveTab] = useState('personal')

  const { avatarUrl, setAvatarUrl, avatarUploading, avatarError, handleAvatarSelected } =
    useProfileAvatar(userId)
  const security = useProfileSecurity(form.email)

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

  if (loading) return <PageLoading />

  return (
    <div className="flex min-h-full w-full flex-col">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Manage your personal information and account security.
      </p>

      <div className="grid flex-1 grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        <ProfileSummaryCard
          avatarUrl={avatarUrl}
          avatarUploading={avatarUploading}
          avatarError={avatarError}
          onAvatarSelected={handleAvatarSelected}
          firstName={form.first_name}
          lastName={form.last_name}
          cooperativeName={cooperativeName}
          email={form.email}
          isOwner={isOwner}
          memberSince={memberSince}
        />

        <div className="flex min-h-0 flex-col lg:col-span-2">
          <div className="flex gap-6 border-b border-gray-200 mb-6">
            <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')}>
              Personal Information
            </TabButton>
            <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
              Security
            </TabButton>
            {isOwner && (
              <TabButton active={activeTab === 'cooperative'} onClick={() => setActiveTab('cooperative')}>
                Cooperative
              </TabButton>
            )}
          </div>

          {activeTab === 'personal' && (
            <PersonalInfoTab
              isOwner={isOwner}
              featureAccess={featureAccess}
              form={form}
              onChange={handleChange}
              editing={editing}
              onEdit={() => {
                setEditing(true)
                setSuccess('')
              }}
              onCancel={() => {
                setEditing(false)
                loadProfile()
              }}
              onSave={handleSave}
              saving={saving}
              error={error}
              success={success}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab email={form.email} security={security} />
          )}
          {activeTab === 'cooperative' && isOwner && (
            <div className="flex min-h-0 flex-1">
              <CooperativeLogoUploader />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}