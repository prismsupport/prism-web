// Shared server-side helpers for the billing routes.
// Server-only: never import this from a client component.

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { decryptSecret } from '@/lib/billing/secretBox'

export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Confirms the caller is an active Supervisor with billing access
// (the owner, or someone granted the 'billing' feature).
// Returns { ok: true, supabase, admin, userId, cooperativeId }
// or { ok: false, status, error }.
export async function requireBillingSupervisor() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll() {} } }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: 'Not signed in.' }

  const { data: me } = await supabase
    .from('users')
    .select('user_type, cooperative_id, is_active')
    .eq('id', user.id)
    .single()
  if (!me || me.user_type !== 'supervisor' || !me.is_active) {
    return { ok: false, status: 403, error: 'Supervisors only.' }
  }

  const { data: perms } = await supabase
    .from('supervisor')
    .select('is_owner, feature_access')
    .eq('profile_id', user.id)
    .single()
  const allowed = !!perms && (perms.is_owner || (perms.feature_access || []).includes('billing'))
  if (!allowed) {
    return { ok: false, status: 403, error: 'You do not have access to billing.' }
  }

  return {
    ok: true,
    supabase,
    admin: getAdminClient(),
    userId: user.id,
    cooperativeId: me.cooperative_id,
  }
}

// Loads and decrypts a cooperative's saved billing connection.
export async function loadBillingConfig(admin, cooperativeId) {
  const { data } = await admin
    .from('cooperative_settings')
    .select('billing_api_url, billing_api_header, billing_api_key_encrypted, billing_enabled')
    .eq('cooperative_id', cooperativeId)
    .maybeSingle()

  if (!data || !data.billing_api_url || !data.billing_api_key_encrypted) {
    return { configured: false }
  }

  let apiKey
  try {
    apiKey = decryptSecret(data.billing_api_key_encrypted)
  } catch {
    console.error('[billing] could not decrypt the saved API key')
    return { configured: true, unreadable: true }
  }

  return {
    configured: true,
    enabled: !!data.billing_enabled,
    config: {
      baseUrl: data.billing_api_url,
      headerName: data.billing_api_header,
      apiKey,
    },
  }
}

const FAILURE_MESSAGES = {
  not_configured:
    "Billing integration is not set up yet. Use Billing Integration to connect your cooperative's billing API.",
  invalid_config: 'The saved billing settings are invalid. Please review them in Billing Integration.',
  unsafe_url: 'The billing API address is not allowed.',
  auth_failed:
    'The billing system rejected the saved API key. Please update it in Billing Integration.',
  timeout: 'The cooperative billing system took too long to respond.',
  network: 'The cooperative billing system could not be reached.',
  server_error: 'The cooperative billing system reported an error.',
  bad_response: 'The billing system replied in an unexpected format.',
}

export function describeLookupFailure(reason, detail) {
  if (reason === 'unsafe_url' && detail) return detail
  return FAILURE_MESSAGES[reason] || 'The cooperative billing system could not be checked.'
}