'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'

const navItems = [
  { label: 'Dashboard', href: '/supervisor/dashboard' },
  { label: 'Dispatch', href: '/supervisor/dispatch' },
  { label: 'Advisories', href: '/supervisor/advisories' },
  { label: 'Billing Requests', href: '/supervisor/billing-requests' },
  { label: 'FAQ', href: '/supervisor/faq' },
  { label: 'Users', href: '/supervisor/users' },
]

export default function SupervisorLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [supervisorName, setSupervisorName] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/supervisor/login' || pathname === '/supervisor/register') return
    loadSupervisorName()
  }, [pathname])

  async function loadSupervisorName() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    if (data) {
      setSupervisorName(`${data.first_name} ${data.last_name}`)
    }
  }

  if (pathname === '/supervisor/login' || pathname === '/supervisor/register') {
    return children
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/supervisor/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <Logo subtitle="SUPERVISOR PORTAL" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
          <div className="relative w-full max-w-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search reports, tickets, or users..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div className="relative ml-4">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-3"
            >
              <span className="text-sm font-medium text-gray-700">
                {supervisorName || 'Loading…'}
              </span>
              <div className="w-9 h-9 rounded-full bg-gray-200" />
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg border border-gray-200 shadow-lg z-20 overflow-hidden">
                  <Link
                    href="/supervisor/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <main className="p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}