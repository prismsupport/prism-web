'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PermissionsContext = createContext(null)

// Maps a route to the feature key that must be present in feature_access
// for a non-owner Supervisor to reach it. Routes not listed here (Dashboard,
// profile, search) are open to every Supervisor regardless of permissions.
const FEATURE_ROUTES = {
  '/supervisor/dispatch': 'dispatch',
  '/supervisor/advisories': 'advisories',
  '/supervisor/faq': 'faq',
  '/supervisor/billing': 'billing',
}

export function PermissionsProvider({ children }) {
  const [isOwner, setIsOwner] = useState(false)
  const [featureAccess, setFeatureAccess] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('supervisor')
      .select('is_owner, feature_access')
      .eq('profile_id', user.id)
      .single()

    if (data) {
      setIsOwner(!!data.is_owner)
      setFeatureAccess(data.feature_access || [])
    }
    setLoading(false)
  }

  function hasFeature(feature) {
    if (isOwner) return true
    return featureAccess.includes(feature)
  }

  // Users is structurally owner-only — not a grantable feature toggle.
  function canAccessPath(pathname) {
    if (pathname.startsWith('/supervisor/users')) return isOwner
    const requiredFeature = FEATURE_ROUTES[pathname]
    if (!requiredFeature) return true
    return hasFeature(requiredFeature)
  }

  return (
    <PermissionsContext.Provider
      value={{ isOwner, featureAccess, loading, hasFeature, canAccessPath, refresh: load }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider')
  return ctx
}