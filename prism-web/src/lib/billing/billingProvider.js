// BILLING PROVIDER ADAPTER
// The one place that knows how to reach a cooperative's billing system.
// Today it reads the simulated `bill_inquiries` table in a separate Supabase
// project (read-only: this file only ever runs SELECT). If the cooperative's
// bill inquiry API is used instead, only the body of lookupBillingAccount()
// changes. The rest of the system keeps receiving the same standard shape.
//
// Server-only: never import this from a client component.

import { createClient } from '@supabase/supabase-js'
import { normalizeAccountNumber } from '@/lib/billing/matching'

function getBillingClient() {
  const url = process.env.BILLING_SUPABASE_URL
  const key = process.env.BILLING_SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// Standard response shape:
//   { available: false, reason }
//   { available: true, found: false }
//   { available: true, found: true, accountNumber, accountName,
//     latestBill: { period, status, dueDate } }
export async function lookupBillingAccount(accountNumber) {
  const client = getBillingClient()
  if (!client) return { available: false, reason: 'not_configured' }

  const raw = String(accountNumber ?? '').trim()
  const normalized = normalizeAccountNumber(raw)
  const candidates = Array.from(new Set([raw, normalized].filter(Boolean)))
  if (candidates.length === 0) return { available: true, found: false }

  // bill_period is stored as 'YYYY-MM', so sorting it descending gives the
  // newest bill. (created_at can't be used: rows can share one timestamp.)
  const { data, error } = await client
    .from('bill_inquiries')
    .select('account_number, account_name, bill_period, bill_status, due_date')
    .in('account_number', candidates)
    .order('bill_period', { ascending: false })
    .limit(1)

  if (error) {
    // Shown only in the server terminal, never to the supervisor.
    // Logs the error text only: no keys, no billing data.
    console.error('[billing] lookup failed:', error.message, error.code ?? '')
    return { available: false, reason: 'query_failed' }
  }
  if (!data || data.length === 0) return { available: true, found: false }

  const latest = data[0]
  return {
    available: true,
    found: true,
    accountNumber: latest.account_number,
    accountName: latest.account_name,
    latestBill: {
      period: latest.bill_period,
      status: latest.bill_status,
      dueDate: latest.due_date,
    },
  }
}