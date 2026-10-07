import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role to bypass the RLS entirely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.json()
  const {
    userId,
    firstName,
    lastName,
    email,
    contactNumber,
    cooperativeName,
    officeAddress,
    municipality,
    province,
    officialEmail,
  } = body

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId.' }, { status: 400 })
  }

  // Step 1: create the cooperative, starting at Pending Approval
  const { data: coop, error: coopError } = await supabaseAdmin
    .from('cooperatives')
    .insert({
      cooperative_name: cooperativeName,
      office_address: officeAddress,
      municipality,
      province,
      contact_number: contactNumber,
      official_email: officialEmail,
      status: 'Pending Approval',
    })
    .select()
    .single()

  if (coopError) {
    return NextResponse.json({ error: coopError.message }, { status: 500 })
  }

  // Step 2: create the supervisor's personal user row, inactive until approved
    const { error: userError } = await supabaseAdmin.from('users').insert({
    id: userId,
    cooperative_id: coop.id,
    first_name: firstName,
    last_name: lastName,
    phone_number: contactNumber,
    email,
    user_type: 'supervisor',
    is_active: false,
  })

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  // Step 3: mark this user as holding the supervisor role
  const { error: roleError } = await supabaseAdmin
    .from('supervisor')
    .insert({ profile_id: userId, is_owner: true })

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, cooperativeId: coop.id })
}