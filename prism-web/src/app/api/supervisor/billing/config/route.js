import { NextResponse } from 'next/server'
import {
  requireBillingOwner,
  loadBillingConfig,
  describeLookupFailure,
} from '@/lib/billing/billingAccess'
import { validateBillingUrl } from '@/lib/billing/safeFetch'
import { encryptSecret, decryptSecret } from '@/lib/billing/secretBox'
import { testBillingConnection } from '@/lib/billing/billingApiClient'

const HEADER_PATTERN = /^[A-Za-z0-9-]{1,64}$/
const KEY_PATTERN = /^[\x21-\x7E]{1,512}$/ // printable characters, no spaces
const MAX_ACCOUNT_LENGTH = 128

// The mobile Edge Functions refuse these header names, so refuse them here too.
const RESERVED_HEADERS = [
  'host', 'connection', 'content-length', 'content-type', 'transfer-encoding', 'te',
  'trailer', 'upgrade', 'cookie', 'set-cookie', 'origin', 'referer', 'accept',
  'accept-encoding', 'expect', 'forwarded', 'via',
]

function isReservedHeader(name) {
  const lower = name.toLowerCase()
  return RESERVED_HEADERS.includes(lower) || /^(proxy-|sec-|x-forwarded-)/.test(lower)
}

function originOf(value) {
  try {
    return new URL(String(value ?? '')).origin
  } catch {
    return ''
  }
}

function fail(status, error) {
  return NextResponse.json({ error }, { status })
}

// Read the saved settings. The API key is NEVER sent back, only whether one is saved.
export async function GET() {
  const auth = await requireBillingOwner()
  if (!auth.ok) return fail(auth.status, auth.error)

  const { data, error } = await auth.admin
    .from('cooperative_settings')
    .select(
      'billing_api_url, billing_api_header, billing_api_key_encrypted, billing_enabled, billing_last_tested_at, billing_last_test_status'
    )
    .eq('cooperative_id', auth.cooperativeId)
    .maybeSingle()

  if (error) return fail(500, 'Could not load billing settings.')

  const apiUrl = data?.billing_api_url ?? ''
  const hasKey = !!data?.billing_api_key_encrypted
  const enabled = !!data?.billing_enabled

  return NextResponse.json({
    apiUrl,
    headerName: data?.billing_api_header ?? 'X-api-key',
    hasKey,
    enabled,
    // Setup is complete once a connection has been saved and switched on.
    // Connect only saves after a successful test, so this means "it worked once".
    setupComplete: enabled && hasKey && !!apiUrl,
    lastTestedAt: data?.billing_last_tested_at ?? null,
    lastTestStatus: data?.billing_last_test_status ?? null,
  })
}

// Connect: test the typed settings first and save them only if the test passes.
// A blank apiKey keeps the existing key (only when the address did not change).
// Nothing is saved on a failed test, so a typo can never break consumers.
export async function PUT(request) {
  const auth = await requireBillingOwner()
  if (!auth.ok) return fail(auth.status, auth.error)

  const body = await request.json().catch(() => ({}))
  const apiUrl = String(body.apiUrl ?? '').trim()
  const headerName = String(body.headerName ?? '').trim() || 'X-api-key'
  const apiKeyInput = String(body.apiKey ?? '').trim()
  const accountNumber = String(body.accountNumber ?? '').trim()

  if (!apiUrl) return fail(400, 'Enter the billing API address.')

  const urlCheck = await validateBillingUrl(apiUrl)
  if (!urlCheck.ok) return fail(400, urlCheck.error)
  const origin = urlCheck.origin

  if (!HEADER_PATTERN.test(headerName)) {
    return fail(400, 'The header name may only contain letters, numbers, and dashes.')
  }
  if (isReservedHeader(headerName)) {
    return fail(400, 'That header name is reserved. Use the header your billing API expects for the API key.')
  }
  if (apiKeyInput && !KEY_PATTERN.test(apiKeyInput)) {
    return fail(400, 'The API key contains spaces or invalid characters.')
  }
  if (!accountNumber || accountNumber.length > MAX_ACCOUNT_LENGTH) {
    return fail(400, 'Enter a test account number that exists in your billing system.')
  }

  const { data: existing } = await auth.admin
    .from('cooperative_settings')
    .select('billing_api_url, billing_api_key_encrypted')
    .eq('cooperative_id', auth.cooperativeId)
    .maybeSingle()

  const hadKey = !!existing?.billing_api_key_encrypted
  const urlChanged = originOf(existing?.billing_api_url) !== origin

  // A saved key is never sent to a different address without being re-entered
  let apiKey = apiKeyInput
  if (!apiKey) {
    if (!hadKey || urlChanged) {
      return fail(
        400,
        hadKey ? 'Enter the API key again when you change the address.' : 'Enter the API key.'
      )
    }
    try {
      apiKey = decryptSecret(existing.billing_api_key_encrypted)
    } catch {
      return fail(400, 'The saved API key could not be read. Please enter it again.')
    }
  }

  const result = await testBillingConnection({ baseUrl: origin, headerName, apiKey }, accountNumber)
  if (result.status !== 'connected') {
    return NextResponse.json({ ok: false, status: result.status, message: result.message })
  }

  const payload = {
    cooperative_id: auth.cooperativeId,
    billing_api_url: origin,
    billing_api_header: headerName,
    billing_enabled: true,
    billing_last_tested_at: new Date().toISOString(),
    billing_last_test_status: 'connected',
  }

  if (apiKeyInput) {
    try {
      payload.billing_api_key_encrypted = encryptSecret(apiKeyInput)
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

  return NextResponse.json({ ok: true, status: 'connected', message: result.message })
}

// Test the saved connection again with an account number the Owner types.
export async function POST(request) {
  const auth = await requireBillingOwner()
  if (!auth.ok) return fail(auth.status, auth.error)

  const body = await request.json().catch(() => ({}))
  const accountNumber = String(body.accountNumber ?? '').trim()
  if (!accountNumber || accountNumber.length > MAX_ACCOUNT_LENGTH) {
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
      message: 'The saved API key could not be read. Please enter it again and connect.',
    })
  }

  const result = await testBillingConnection(loaded.config, accountNumber)

  await auth.admin
    .from('cooperative_settings')
    .update({
      billing_last_tested_at: new Date().toISOString(),
      billing_last_test_status: result.status,
    })
    .eq('cooperative_id', auth.cooperativeId)

  return NextResponse.json({
    ok: result.status === 'connected',
    status: result.status,
    message: result.message,
  })
}