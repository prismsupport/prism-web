import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // guards /superadmin routes, except the login page
  const isSuperadminRoute = pathname.startsWith('/superadmin')
  const isLoginPage = pathname === '/superadmin/login'

  if (!isSuperadminRoute || isLoginPage) {
    return NextResponse.next()
  }

  const { supabase, response } = createMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

export const config = {
  matcher: ['/superadmin/:path*'],
}