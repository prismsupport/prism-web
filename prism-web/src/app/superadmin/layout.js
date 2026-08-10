'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Pending Registrations', href: '/superadmin/pending' },
  { label: 'All Cooperatives', href: '/superadmin/cooperatives' },
]

export default function SuperadminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()

  // The login page has no sidebar — it's a standalone screen.
  // Every other /superadmin/* page gets wrapped with the sidebar below.
  if (pathname === '/superadmin/login') {
    return children
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/superadmin/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <path d="M12 2 3 6v6c0 5 4 9 9 10 5-1 9-5 9-10V6l-9-4Z" />
              <path d="M9.5 12.5 11 14l3.5-3.5" />
            </svg>
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-gray-900 leading-none">
              PRISM
            </div>
            <div className="text-[10px] font-bold tracking-wide text-gray-400 mt-0.5">
              SUPERADMIN PORTAL
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
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

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content area — each page's content renders here */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}