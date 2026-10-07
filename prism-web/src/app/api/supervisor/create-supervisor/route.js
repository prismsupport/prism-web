import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { cooperativeId, firstName, lastName, email, password, contactNumber, featureAccess } = body

    if (!cooperativeId || !firstName || !lastName || !contactNumber || !email || !password) {
      return NextResponse.json({ error: 'All supervisor fields are required.' }, { status: 400 })
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          user_type: 'supervisor',
        },
      })

    if (authError) {
      const authErrorDetails = Object.getOwnPropertyNames(authError).reduce((details, property) => {
        details[property] = authError[property]
        return details
      }, {})
      console.error('Supervisor Auth account creation failed:', authErrorDetails)
      const status =
        authError.status >= 500
          ? 502
          : authError.status === 422 || authError.code === 'email_exists'
            ? 409
            : 400
      return NextResponse.json(
        { error: authError.message || 'Supabase Auth could not create the account.' },
        { status }
      )
    }

    const newUserId = authData.user.id

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: newUserId,
      cooperative_id: cooperativeId,
      first_name: firstName,
      last_name: lastName,
      phone_number: contactNumber,
      email,
      user_type: 'supervisor',
      is_active: true,
    })

    if (userError) {
      console.error('Supervisor users row creation failed:', userError)
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    const { error: roleError } = await supabaseAdmin.from('supervisor').insert({
      profile_id: newUserId,
      feature_access: featureAccess || [],
    })

    if (roleError) {
      console.error('Supervisor role row creation failed:', roleError)
      await supabaseAdmin.from('users').delete().eq('id', newUserId)
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: roleError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Supervisor account creation failed:', error)
    return NextResponse.json(
      { error: 'Unable to create the supervisor account. Check the server log for details.' },
      { status: 500 }
    )
  }
}