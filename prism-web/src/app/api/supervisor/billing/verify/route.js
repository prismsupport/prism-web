import { NextResponse } from 'next/server'
import {
  requireBillingSupervisor,
  loadBillingConfig,
  describeLookupFailure,
} from '@/lib/billing/billingAccess'
import { lookupViaBillingApi } from '@/lib/billing/billingApiClient'
import { compareNames } from '@/lib/billing/matching'

export async function POST(request) {
  const { linkId } = await request.json()
  if (!linkId) {
    return NextResponse.json({ error: 'Missing linkId.' }, { status: 400 })
  }

  const auth = await requireBillingSupervisor()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, admin, cooperativeId } = auth

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
  if (!consumer || consumer.cooperative_id !== cooperativeId) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
  }

  // Use THIS cooperative's own saved billing connection
  const loaded = await loadBillingConfig(admin, cooperativeId)
  if (!loaded.configured) {
    return NextResponse.json({ available: false, message: describeLookupFailure('not_configured') })
  }
  if (loaded.unreadable) {
    return NextResponse.json({
      available: false,
      message: 'The saved API key could not be read. Please enter it again in Billing Integration.',
    })
  }
  if (!loaded.enabled) {
    return NextResponse.json({
      available: false,
      message: 'Billing integration is turned off. Turn it on in Billing Integration.',
    })
  }

  const lookup = await lookupViaBillingApi(loaded.config, link.account_number)

  if (!lookup.available) {
    console.error('[billing] verify failed:', lookup.reason)
    return NextResponse.json({
      available: false,
      message: describeLookupFailure(lookup.reason, lookup.message),
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