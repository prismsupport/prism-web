'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown, LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/ui/TopBar'
import NotificationBell from '@/components/ui/NotificationBell'
import { toast } from '@/lib/toast'

export default function SuperadminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

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
    <div className="relative min-h-screen bg-gray-50">
      {/* Soft wash behind the page header so the content does not start on a flat grey */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-100/70 via-blue-50/40 to-transparent"
      />

      <TopBar
        subtitle="SUPERADMIN DASHBOARD"
        rightContent={
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-6 w-px bg-gray-200" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                  SA
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                        <ShieldCheck size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Platform Admin</p>
                        <p className="text-xs text-gray-400">Superadmin access</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <LogOut size={16} className="text-gray-400" aria-hidden="true" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <main className="relative mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}