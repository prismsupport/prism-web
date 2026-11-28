'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

// Owns the profile photo state and upload. The page sets the first value with setAvatarUrl.
export function useProfileAvatar(userId) {
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')

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

  return { avatarUrl, setAvatarUrl, avatarUploading, avatarError, handleAvatarSelected }
}