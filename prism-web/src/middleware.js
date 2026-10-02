import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  const isSuperadminRoute = pathname.startsWith('/superadmin')
  const isSuperadminLogin = pathname === '/superadmin/login'

  const isSupervisorRoute = pathname.startsWith('/supervisor')
  const isSupervisorPublicPage =
    pathname === '/supervisor/login' || pathname === '/supervisor/register'

  if ((!isSuperadminRoute || isSuperadminLogin) && (!isSupervisorRoute || isSupervisorPublicPage)) {
    return NextResponse.next()
  }

  const { supabase, response } = createMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isSuperadminRoute && !isSuperadminLogin) {
    if (!user) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }

    // Confirm user is active superadmin, not just any logged-in Supabase user.
    const { data: superadmin } = await supabase
      .from('super_admins')
      .select('id, is_active')
      .eq('id', user.id)
      .single()

    if (!superadmin || superadmin.is_active !== true) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }

    return response
  }

  if (isSupervisorRoute && !isSupervisorPublicPage) {
    if (!user) {
      return NextResponse.redirect(new URL('/supervisor/login', request.url))
    }

    // Confirm this is an active Supervisor account, not just any logged-in
    // Supabase user (e.g. a consumer, lineman, or superadmin session).
    // Fine-grained feature/owner permissions stay client-side in
    // PermissionsContext — this only answers "is this role allowed here at all."
    const { data: userRow } = await supabase
      .from('users')
      .select('user_type, is_active')
      .eq('id', user.id)
      .single()

    if (!userRow || userRow.user_type !== 'supervisor' || userRow.is_active !== true) {
      return NextResponse.redirect(new URL('/supervisor/login', request.url))
    }

    return response
  }

  return response
}

export const config = {
  matcher: ['/superadmin/:path*', '/supervisor/:path*'],
}