// Tests a cooperative's billing API the same way the mobile Edge Functions use it.
//
// Mobile calls two endpoints, so the test calls both:
//   1. POST {address}/api/registration/accounts/lookup  { account_number }
//      -> used when a consumer registers or adds an account.
//   2. GET  {address}/api/accounts/{account}?limit=100&offset=0
//      -> used when a consumer opens their bills.
// A connection only counts as "connected" when both replies have the layout
// mobile requires. If mobile's checks change, change the checks here too.
//
// Server-only: never import this from a client component.

import { normalizeAccountNumber } from '@/lib/billing/matching'
import { validateBillingUrl, fetchJsonSafely } from '@/lib/billing/safeFetch'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const ACCOUNT_FIELDS = [
  'account_id',
  'account_number',
  'first_name',
  'last_name',
  'municipality',
  'barangay',
  'zone',
  'account_type',
]
const PAGE_SIZE = 100
const MAX_BILLS = 2000

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function failed(message) {
  return { status: 'failed', message }
}

// One quick retry for a server error or network hiccup (e.g. a sleeping host)
async function callApi(url, headerName, apiKey, options) {
  let res = await fetchJsonSafely(url, { [headerName]: apiKey }, options)
  if (res.reason === 'network' || res.status >= 500) {
    await sleep(800)
    res = await fetchJsonSafely(url, { [headerName]: apiKey }, options)
  }
  return res
}

// Returns a message when the request itself failed, or null when there is a reply to read.
function transportProblem(res, what) {
  if (res.reason === 'timeout') return `The ${what} took too long to answer.`
  if (res.reason === 'network') return `The ${what} could not be reached.`
  if (res.reason === 'redirect') {
    return `The ${what} tried to redirect the request, which is not allowed. Use the final address.`
  }
  if (res.reason === 'too_large') return `The ${what} replied with too much data.`
  if (res.status === 401 || res.status === 403) return 'The billing system rejected the API key.'
  if (res.status >= 500) return `The ${what} reported an error (HTTP ${res.status}).`
  return null
}

async function checkLookup(base, headerName, apiKey, rawAccount) {
  const res = await callApi(`${base}/api/registration/accounts/lookup`, headerName, apiKey, {
    method: 'POST',
    body: { account_number: rawAccount },
  })
  const problem = transportProblem(res, 'account lookup')
  if (problem) return { problem }
  if (res.status === 404) return { notFound: true }
  if (!res.ok) {
    return { problem: `The account lookup replied with an unexpected status (HTTP ${res.status}).` }
  }
  if (!/^application\/json/i.test(res.contentType)) {
    return { problem: 'The account lookup did not reply with JSON.' }
  }

  const data = res.json?.data
  if (!isRecord(data)) return { problem: 'The account lookup reply has no "data" object.' }

  const missing = ACCOUNT_FIELDS.filter(
    (f) => typeof data[f] !== 'string' || !data[f].trim() || data[f].length > 512
  )
  if (missing.length > 0) {
    return {
      problem: `The account lookup reply is missing or has invalid fields: ${missing.join(', ')}.`,
    }
  }
  if (!['residential', 'commercial'].includes(data.account_type.trim().toLowerCase())) {
    return { problem: 'The account_type in the lookup reply must be "residential" or "commercial".' }
  }
  if (data.meter_number != null && (typeof data.meter_number !== 'string' || data.meter_number.length > 128)) {
    return { problem: 'The meter_number in the lookup reply must be text of 128 characters or fewer.' }
  }
  if (normalizeAccountNumber(data.account_number) !== normalizeAccountNumber(rawAccount)) {
    return { problem: 'The account lookup returned a different account number than the one requested.' }
  }
  return { account: data }
}

function billRowProblem(row, normalizedAccount) {
  if (!isRecord(row)) return 'a bill is not an object'
  if (typeof row.id !== 'string' || !row.id || row.id.length > 128) return 'a bill has no "id"'
  if (normalizeAccountNumber(String(row.account_number ?? '')) !== normalizedAccount) {
    return 'a bill belongs to a different account'
  }
  if (typeof row.bill_period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.bill_period)) {
    return 'bill_period must look like 2026-10'
  }
  if (!['paid', 'unpaid'].includes(String(row.bill_status))) {
    return 'bill_status must be "paid" or "unpaid"'
  }
  for (const field of ['previous_reading', 'present_reading', 'kwh_used', 'amount_due']) {
    const v = row[field]
    if (
      (typeof v !== 'number' && typeof v !== 'string') ||
      (typeof v === 'string' && !v.trim()) ||
      !Number.isFinite(Number(v)) ||
      Number(v) < 0
    ) {
      return `${field} must be a number that is not negative`
    }
  }
  for (const field of ['due_date', 'created_at']) {
    const v = row[field]
    if (v != null && (typeof v !== 'string' || v.length > 64 || !Number.isFinite(Date.parse(v)))) {
      return `${field} must be a valid date`
    }
  }
  return null
}

// Returns a problem message, or null when the bill history works.
async function checkBills(base, headerName, apiKey, accountNumber) {
  const url = `${base}/api/accounts/${encodeURIComponent(accountNumber)}?limit=${PAGE_SIZE}&offset=0`
  const res = await callApi(url, headerName, apiKey, {})
  const problem = transportProblem(res, 'bill history')
  if (problem) return problem
  if (res.status === 404) return 'The bill history was not found for this account.'
  if (!res.ok) return `The bill history replied with an unexpected status (HTTP ${res.status}).`
  if (!/^application\/json/i.test(res.contentType)) return 'The bill history did not reply with JSON.'

  const json = res.json
  if (!isRecord(json) || !isRecord(json.account) || !Array.isArray(json.data) || !isRecord(json.meta)) {
    return 'The bill history reply must contain "account", "data" (a list) and "meta".'
  }
  const normalized = normalizeAccountNumber(accountNumber)
  if (normalizeAccountNumber(String(json.account.account_number ?? '')) !== normalized) {
    return 'The bill history "account" does not match the requested account.'
  }
  const { count, limit, offset } = json.meta
  if (
    !Number.isSafeInteger(count) ||
    count < 0 ||
    count > MAX_BILLS ||
    limit !== PAGE_SIZE ||
    offset !== 0 ||
    json.data.length !== Math.min(PAGE_SIZE, count)
  ) {
    return 'The bill history "meta" must contain a count, a limit of 100, and an offset of 0 that match the rows returned.'
  }
  for (const row of json.data) {
    const rowProblem = billRowProblem(row, normalized)
    if (rowProblem) return `The bill history has an invalid bill: ${rowProblem}.`
  }
  return null
}

// config = { baseUrl, headerName, apiKey }
// Returns { status: 'connected' | 'account_not_found' | 'failed', message }
export async function testBillingConnection(config, accountNumber) {
  const raw = String(accountNumber ?? '').trim()
  if (!raw || raw.length > 128 || !normalizeAccountNumber(raw)) {
    return failed('Enter a valid test account number.')
  }

  const headerName = String(config?.headerName || '').trim()
  if (!config?.baseUrl || !config?.apiKey || !/^[A-Za-z0-9-]{1,64}$/.test(headerName)) {
    return failed('The billing settings are incomplete.')
  }

  const check = await validateBillingUrl(config.baseUrl)
  if (!check.ok) return failed(check.error)
  const base = check.origin

  const lookup = await checkLookup(base, headerName, config.apiKey, raw)
  if (lookup.problem) return failed(lookup.problem)
  if (lookup.notFound) {
    return {
      status: 'account_not_found',
      message:
        'The billing system answered "not found" for that account number. Check the number and the address.',
    }
  }

  const billsProblem = await checkBills(base, headerName, config.apiKey, lookup.account.account_number.trim())
  if (billsProblem) return failed(billsProblem)

  return {
    status: 'connected',
    message: `Connected. Found account ${lookup.account.account_number.trim()} (${lookup.account.first_name.trim()} ${lookup.account.last_name.trim()}) and its bill history.`,
  }
}