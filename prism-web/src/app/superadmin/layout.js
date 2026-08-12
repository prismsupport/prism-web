'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/ui/TopBar'

export default function SuperadminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()

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
      <TopBar
        subtitle="SUPERADMIN DASHBOARD"
        rightContent={
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        }
      />

      <main className="p-8">{children}</main>
    </div>
  )
}