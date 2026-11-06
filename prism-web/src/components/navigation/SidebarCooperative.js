'use client'

import useCooperativeProfile from '@/lib/supervisor/useCooperativeProfile'
import CooperativeLogo from '@/components/ui/CooperativeLogo'

// Shows which cooperative the supervisor is signed in to, under the PRISM logo.
export default function SidebarCooperative({ collapsed }) {
  const { name, logoUrl, loading } = useCooperativeProfile()
  if (loading || !name) return null

  return (
    <div
      title={name}
      className={`flex shrink-0 items-center gap-3 border-b border-white/10 py-3 ${
        collapsed ? 'justify-center px-0' : 'px-5'
      }`}
    >
      <CooperativeLogo name={name} src={logoUrl} size={32} />
      {!collapsed && (
        <p className="min-w-0 truncate text-sm font-semibold text-blue-100">{name}</p>
      )}
    </div>
  )
}