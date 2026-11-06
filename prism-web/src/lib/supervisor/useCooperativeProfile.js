'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'

// Fired after the logo is added, changed or removed, so every place that shows it refreshes.
export const COOP_PROFILE_CHANGED = 'cooperative-profile-changed'

// The signed-in supervisor's cooperative: id, name and logo (logoUrl is null when none).
export default function useCooperativeProfile() {
  const [profile, setProfile] = useState({ id: null, name: '', logoUrl: null, loading: true })

  const load = useCallback(async () => {
    const supabase = createClient()
    const coopId = await getMyCooperativeId(supabase)
    if (!coopId) {
      setProfile({ id: null, name: '', logoUrl: null, loading: false })
      return
    }
    const { data } = await supabase
      .from('cooperatives')
      .select('id, cooperative_name, logo_url')
      .eq('id', coopId)
      .maybeSingle()
    setProfile({
      id: coopId,
      name: data?.cooperative_name || '',
      logoUrl: data?.logo_url || null,
      loading: false,
    })
  }, [])

  useEffect(() => {
    load()
    window.addEventListener(COOP_PROFILE_CHANGED, load)
    return () => window.removeEventListener(COOP_PROFILE_CHANGED, load)
  }, [load])

  return { ...profile, refresh: load }
}