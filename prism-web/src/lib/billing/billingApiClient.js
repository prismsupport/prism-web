// Looks up an account through a cooperative's own billing API.
// Expects the layout your current test API returns:
//   { data: [ { bill_period, bill_status, due_date, ... } ],
//     summary: { account_number, account_name, latest_bill_period, ... } }
// Amounts, readings and balances in the reply are ignored on purpose.
// If another cooperative's API uses a different layout, only
// parseAccountResponse() needs to change.
//
// Server-only: never import this from a client component.

import { normalizeAccountNumber } from '@/lib/billing/matching'
import { validateBillingUrl, fetchJsonSafely } from '@/lib/billing/safeFetch'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function parseAccountResponse(json) {
  const summary = json?.summary
  const bills = Array.isArray(json?.data) ? json.data : []

  const newestFirst = [...bills].sort((a, b) =>
    String(b.bill_period).localeCompare(String(a.bill_period))
  )
  const latest =
    bills.find((b) => b.bill_period === summary?.latest_bill_period) || newestFirst[0] || null

  const accountName = summary?.account_name ?? latest?.account_name
  const accountNumber = summary?.account_number ?? latest?.account_number
  if (!accountName || !accountNumber) return null

  return {
    accountNumber: String(accountNumber),
    accountName: String(accountName),
    latestBill: {
      period: summary?.latest_bill_period ?? latest?.bill_period ?? null,
      status: latest?.bill_status ?? null,
      dueDate: latest?.due_date ?? null,
    },
  }
}

async function callOnce(url, headerName, apiKey) {
  const res = await fetchJsonSafely(url, { [headerName]: apiKey })

  if (res.reason) {
    if (res.reason === 'timeout') return { available: false, reason: 'timeout' }
    if (res.reason === 'network') return { available: false, reason: 'network' }
    return { available: false, reason: 'bad_response' }
  }

  if (res.status === 404) return { available: true, found: false }
  if (res.status === 401 || res.status === 403) return { available: false, reason: 'auth_failed' }
  if (res.status >= 500) return { available: false, reason: 'server_error' }

  if (res.ok) {
    const parsed = parseAccountResponse(res.json)
    if (parsed) return { available: true, found: true, ...parsed }
    if (Array.isArray(res.json?.data) && res.json.data.length === 0) {
      return { available: true, found: false }
    }
  }
  return { available: false, reason: 'bad_response' }
}

// config = { baseUrl, headerName, apiKey }
// Standard result:
//   { available: false, reason, message? }
//   { available: true, found: false }
//   { available: true, found: true, accountNumber, accountName,
//     latestBill: { period, status, dueDate } }
export async function lookupViaBillingApi(config, accountNumber) {
  const raw = String(accountNumber ?? '').trim()
  if (!raw) return { available: true, found: false }
  if (!config?.baseUrl || !config?.apiKey) return { available: false, reason: 'not_configured' }

  const headerName = String(config.headerName || 'X-api-key').trim()
  if (!/^[A-Za-z0-9-]+$/.test(headerName)) return { available: false, reason: 'invalid_config' }

  const base = String(config.baseUrl).trim().replace(/\/+$/, '')
  const check = await validateBillingUrl(base)
  if (!check.ok) return { available: false, reason: 'unsafe_url', message: check.error }

  const normalized = normalizeAccountNumber(raw)
  const candidates = Array.from(new Set([raw, normalized].filter(Boolean)))

  for (const candidate of candidates) {
    const url = `${base}/${encodeURIComponent(candidate)}`

    let result = await callOnce(url, headerName, config.apiKey)
    // One quick retry for a server error or network hiccup (e.g. a sleeping host)
    if (!result.available && (result.reason === 'server_error' || result.reason === 'network')) {
      await sleep(800)
      result = await callOnce(url, headerName, config.apiKey)
    }

    if (!result.available) return result
    if (result.found) return result
  }

  return { available: true, found: false }
}