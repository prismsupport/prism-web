import { NextResponse } from 'next/server'
import {
  requireBillingSupervisor,
  loadBillingConfig,
  describeLookupFailure,
} from '@/lib/billing/billingAccess'
import { validateBillingUrl } from '@/lib/billing/safeFetch'
import { encryptSecret } from '@/lib/billing/secretBox'
import { lookupViaBillingApi } from '@/lib/billing/billingApiClient'

const HEADER_PATTERN = /^[A-Za-z0-9-]{1,64}$/
const KEY_PATTERN = /^[\x21-\x7E]{1,512}$/ // printable characters, no spaces

function fail(status, error) {
  return NextResponse.json({ error }, { status })
}

// Read the saved settings. The API key is NEVER sent back, only whether one is saved.
export async function GET() {
  const auth = await requireBillingSupervisor()
  if (!auth.ok) return fail(auth.status, auth.error)

  const { data, error } = await auth.admin
    .from('cooperative_settings')
    .select(
      'billing_api_url, billing_api_header, billing_api_key_encrypted, billing_enabled, billing_last_tested_at, billing_last_test_status'
    )
    .eq('cooperative_id', auth.cooperativeId)
    .maybeSingle()

  if (error) return fail(500, 'Could not load billing settings.')

  return NextResponse.json({
    apiUrl: data?.billing_api_url ?? '',
    headerName: data?.billing_api_header ?? 'X-api-key',
    hasKey: !!data?.billing_api_key_encrypted,
    enabled: !!data?.billing_enabled,
    lastTestedAt: data?.billing_last_tested_at ?? null,
    lastTestStatus: data?.billing_last_test_status ?? null,
  })
}

// Save the settings. A blank apiKey keeps the existing key.
export async function PUT(request) {
  const auth = await requireBillingSupervisor()
  if (!auth.ok) return fail(auth.status, auth.error)

  const body = await request.json().catch(() => ({}))
  const apiUrl = String(body.apiUrl ?? '').trim().replace(/\/+$/, '')
  const headerName = String(body.headerName ?? '').trim() || 'X-api-key'
  const apiKey = String(body.apiKey ?? '').trim()
  const enabled = !!body.enabled

  if (!apiUrl) return fail(400, 'Enter the billing API address.')

  const urlCheck = await validateBillingUrl(apiUrl)
  if (!urlCheck.ok) return fail(400, urlCheck.error)

  if (!HEADER_PATTERN.test(headerName)) {
    return fail(400, 'The header name may only contain letters, numbers, and dashes.')
  }
  if (apiKey && !KEY_PATTERN.test(apiKey)) {
    return fail(400, 'The API key contains spaces or invalid characters.')
  }

  const { data: existing } = await auth.admin
    .from('cooperative_settings')
    .select('billing_api_url, billing_api_key_encrypted')
    .eq('cooperative_id', auth.cooperativeId)
    .maybeSingle()

  const hadKey = !!existing?.billing_api_key_encrypted
  const urlChanged = (existing?.billing_api_url ?? '') !== apiUrl

  // A saved key is never sent to a different address without being re-entered
  if (!apiKey && (!hadKey || urlChanged)) {
    return fail(
      400,
      hadKey ? 'Enter the API key again when you change the address.' : 'Enter the API key.'
    )
  }

  const payload = {
    cooperative_id: auth.cooperativeId,
    billing_api_url: apiUrl,
    billing_api_header: headerName,
    billing_enabled: enabled,
    billing_last_tested_at: null,
    billing_last_test_status: null,
  }

  if (apiKey) {
    try {
      payload.billing_api_key_encrypted = encryptSecret(apiKey)
    } catch (err) {
      console.error('[billing] could not encrypt the key:', err.message)
      return fail(500, 'Billing settings cannot be saved: the server encryption key is not set up.')
    }
  }

  const { error } = await auth.admin
    .from('cooperative_settings')
    .upsert(payload, { onConflict: 'cooperative_id' })

  if (error) {
    console.error('[billing] save failed:', error.message)
    return fail(500, 'Could not save billing settings.')
  }

  return NextResponse.json({ success: true })
}

// Test the saved connection with an account number the supervisor types.
export async function POST(request) {
  const auth = await requireBillingSupervisor()
  if (!auth.ok) return fail(auth.status, auth.error)

  const body = await request.json().catch(() => ({}))
  const accountNumber = String(body.accountNumber ?? '').trim()
  if (!accountNumber || accountNumber.length > 64) {
    return fail(400, 'Enter an account number to test with.')
  }

  const loaded = await loadBillingConfig(auth.admin, auth.cooperativeId)
  if (!loaded.configured) {
    return NextResponse.json({
      ok: false,
      status: 'failed',
      message: describeLookupFailure('not_configured'),
    })
  }
  if (loaded.unreadable) {
    return NextResponse.json({
      ok: false,
      status: 'failed',
      message: 'The saved API key could not be read. Please enter it again and save.',
    })
  }

  const lookup = await lookupViaBillingApi(loaded.config, accountNumber)

  let ok = false
  let status
  let message
  if (!lookup.available) {
    status = 'failed'
    message = describeLookupFailure(lookup.reason, lookup.message)
  } else if (!lookup.found) {
    status = 'account_not_found'
    message =
      'The billing system answered, but that account number was not found. Check the number, or the address may be wrong.'
  } else {
    ok = true
    status = 'connected'
    message = `Connected. Found account ${lookup.accountNumber} (${lookup.accountName}).`
  }

  await auth.admin
    .from('cooperative_settings')
    .update({
      billing_last_tested_at: new Date().toISOString(),
      billing_last_test_status: status,
    })
    .eq('cooperative_id', auth.cooperativeId)

  return NextResponse.json({ ok, status, message })
}