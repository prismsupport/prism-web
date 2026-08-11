'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SuperadminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()

  // The login page is a standalone screen with no top bar.
  if (pathname === '/superadmin/login') {
    return children
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/superadmin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-4">
          <span className="text-xs font-bold tracking-wide text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            SUPERADMIN
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Page content */}
      <main className="p-8">{children}</main>
    </div>
  )
}