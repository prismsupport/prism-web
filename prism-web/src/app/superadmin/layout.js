'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/ui/TopBar'
import NotificationBell from '@/components/ui/NotificationBell'
import { toast } from '@/lib/toast'

export default function SuperadminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()

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
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>
        }
      />

      <main className="p-8">{children}</main>
    </div>
  )
}