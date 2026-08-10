import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses the service role key so this check can read super_admins securely from the server, regardless of RLS policies on that table.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ isSuperadmin: false })
  }

  const { data, error } = await supabaseAdmin
    .from('super_admins')
    .select('id, is_active')
    .eq('id', userId)
    .single()

  const isSuperadmin = !!data && data.is_active === true && !error

  return NextResponse.json({ isSuperadmin })
}