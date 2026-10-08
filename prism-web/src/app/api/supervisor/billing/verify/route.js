import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { lookupBillingAccount } from '@/lib/billing/billingProvider'
import { compareNames } from '@/lib/billing/matching'

export async function POST(request) {
  const { linkId } = await request.json()
  if (!linkId) {
    return NextResponse.json({ error: 'Missing linkId.' }, { status: 400 })
  }

  // Act as the logged-in user, so database rules apply to this check too
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll() {} } }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const { data: me } = await supabase
    .from('users')
    .select('user_type, cooperative_id')
    .eq('id', user.id)
    .single()
  if (!me || me.user_type !== 'supervisor') {
    return NextResponse.json({ error: 'Supervisors only.' }, { status: 403 })
  }

  // The route looks up the request itself from linkId. The client cannot
  // type in an arbitrary account number, so this can't be used as a
  // general account-lookup tool.
  const { data: link } = await supabase
    .from('consumer_bill_links')
    .select('*')
    .eq('link_id', linkId)
    .single()
  if (!link) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  }

  const { data: consumer } = await supabase
    .from('users')
    .select('first_name, last_name, cooperative_id')
    .eq('id', link.consumer_id)
    .single()
  if (!consumer || consumer.cooperative_id !== me.cooperative_id) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
  }

  const lookup = await lookupBillingAccount(link.account_number)

  if (!lookup.available) {
    return NextResponse.json({
      available: false,
      message:
        lookup.reason === 'not_configured'
          ? 'The billing system connection is not configured.'
          : 'The cooperative billing system could not be reached.',
    })
  }

  if (!lookup.found) {
    return NextResponse.json({ available: true, found: false, verdict: 'not_found', checks: [] })
  }

  const requesterName = `${consumer.first_name} ${consumer.last_name}`
  const accountNameResult = compareNames(link.account_name, lookup.accountName)
  const requesterResult = compareNames(requesterName, lookup.accountName)

  const checks = [
    {
      key: 'account_number',
      label: 'Account number',
      requested: link.account_number,
      record: lookup.accountNumber,
      result: 'match',
    },
    {
      key: 'account_name',
      label: 'Account name',
      requested: link.account_name,
      record: lookup.accountName,
      result: accountNameResult,
    },
    {
      key: 'requester_name',
      label: "Requester's registered name",
      requested: requesterName,
      record: lookup.accountName,
      result: requesterResult,
    },
  ]

  const ok = (r) => r === 'match' || r === 'similar'
  let verdict
  if (accountNameResult === 'mismatch') verdict = 'mismatch'
  else if (ok(accountNameResult) && ok(requesterResult)) verdict = 'likely_valid'
  else verdict = 'needs_review' // e.g. the bill is in a family member's name

  return NextResponse.json({
    available: true,
    found: true,
    verdict,
    checks,
    latestBill: lookup.latestBill,
  })
}