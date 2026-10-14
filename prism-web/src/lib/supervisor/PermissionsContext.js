'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PermissionsContext = createContext(null)

// Every restricted page, matched by path prefix so sub-pages are covered too
// (e.g. /supervisor/dispatch/report/123 follows /supervisor/dispatch).
// Pages not listed here (Dashboard, profile, search) are open to every Supervisor.
const PAGE_RULES = [
  { prefix: '/supervisor/users', label: 'Users', ownerOnly: true },
  { prefix: '/supervisor/dispatch', label: 'Dispatch', feature: 'dispatch' },
  { prefix: '/supervisor/lineman-performance', label: 'Lineman Performance', feature: 'dispatch' },
  { prefix: '/supervisor/advisories', label: 'Advisories', feature: 'advisories' },
  { prefix: '/supervisor/service-areas', label: 'Service Areas', feature: 'advisories' },
  { prefix: '/supervisor/faq', label: 'FAQ', feature: 'faq' },
  { prefix: '/supervisor/billing', label: 'Billing Requests', feature: 'billing' },
]

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(prefix + '/')
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

  // Returns null when the page is allowed, otherwise { label, ownerOnly }
  function getRestriction(pathname) {
    const rule = PAGE_RULES.find((r) => matchesPrefix(pathname, r.prefix))
    if (!rule) return null
    if (rule.ownerOnly) return isOwner ? null : { label: rule.label, ownerOnly: true }
    return hasFeature(rule.feature) ? null : { label: rule.label, ownerOnly: false }
  }

  function canAccessPath(pathname) {
    return getRestriction(pathname) === null
  }

  return (
    <PermissionsContext.Provider
      value={{
        isOwner,
        featureAccess,
        loading,
        hasFeature,
        getRestriction,
        canAccessPath,
        refresh: load,
      }}
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