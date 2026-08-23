import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.json()
  const {
    cooperativeId,
    firstName,
    lastName,
    email,
    password,
    contactNumber,
    companyIdNumber,
    assignedAreaOffice,
  } = body

  if (!cooperativeId || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const newUserId = authData.user.id

  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: newUserId,
    cooperative_id: cooperativeId,
    first_name: firstName,
    last_name: lastName,
    phone_number: contactNumber,
    email,
    user_type: 'lineman',
    is_active: true,
  })

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  const { error: roleError } = await supabaseAdmin.from('lineman').insert({
    profile_id: newUserId,
    company_id_number: companyIdNumber,
    assigned_area_office: assignedAreaOffice,
  })

  if (roleError) {
    await supabaseAdmin.from('users').delete().eq('id', newUserId)
    await supabaseAdmin.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: roleError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}