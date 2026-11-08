'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/ui/TopBar'
import NotificationBell from '@/components/ui/NotificationBell'
import { toast } from '@/lib/toast'

export default function SuperadminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === '/superadmin/login') {
    return children
  }

  async function handleLogout() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Logged out')
    router.push('/superadmin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar
        subtitle="SUPERADMIN DASHBOARD"
        rightContent={
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-6 w-px bg-gray-200" />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full p-0.5 hover:bg-gray-100"
                aria-label="Account menu"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">SA</span>
              </button>
              {menuOpen && (
                <>
                  <button className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">Platform Admin</p>
                      <p className="text-xs text-gray-400">Superadmin</p>
                    </div>
                    <button onClick={handleLogout} className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}