// Safe calls to a cooperative's billing API.
// A supervisor types the address, and our server then calls it, so we must
// make sure the address cannot be used to reach internal services.
//
// Rules: https only, default port only, no embedded passwords, no query
// string, public addresses only, no redirects, 15 second timeout, and a
// size limit on the reply.
//
// Known limit: the address is checked right before each request. A
// determined attacker who controls DNS could still race that check.
// Acceptable for this project's scope.
//
// Server-only: never import this from a client component.

import dns from 'dns/promises'
import net from 'net'

const TIMEOUT_MS = 15000
const MAX_BYTES = 256 * 1024

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    )
  }
  if (net.isIPv6(address)) {
    const v = address.toLowerCase()
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fc') || v.startsWith('fd')) return true
    if (/^fe[89ab]/.test(v)) return true
    if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7))
    return false
  }
  return true // unknown format: refuse
}

export async function validateBillingUrl(rawUrl) {
  let url
  try {
    url = new URL(String(rawUrl ?? '').trim())
  } catch {
    return { ok: false, error: 'The billing API address is not a valid URL.' }
  }

  if (url.protocol !== 'https:') {
    return { ok: false, error: 'The billing API address must start with https://' }
  }
  if (url.username || url.password) {
    return { ok: false, error: 'The address must not contain a username or password.' }
  }
  if (url.port && url.port !== '443') {
    return { ok: false, error: 'Only the standard secure port is allowed.' }
  }
  if (url.search || url.hash) {
    return { ok: false, error: 'The address must not contain "?" or "#" parts.' }
  }

  let addresses
  try {
    addresses = await dns.lookup(url.hostname, { all: true })
  } catch {
    return { ok: false, error: 'The billing API address could not be found.' }
  }
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
    return {
      ok: false,
      error: 'The billing API address points to a private or internal network, which is not allowed.',
    }
  }

  return { ok: true, url }
}

async function readLimited(res) {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new Error('too_large')
    }
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks).toString('utf8')
}

// Returns { ok, status, json } on any HTTP reply, or
// { ok: false, status, reason } when something went wrong
// (reason: 'redirect' | 'too_large' | 'timeout' | 'network').
export async function fetchJsonSafely(url, headers = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', ...headers },
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    })

    if (res.status >= 300 && res.status < 400) {
      return { ok: false, status: res.status, reason: 'redirect' }
    }

    let text = ''
    try {
      text = await readLimited(res)
    } catch (err) {
      const reason =
        err?.message === 'too_large' ? 'too_large' : err?.name === 'AbortError' ? 'timeout' : 'network'
      return { ok: false, status: res.status, reason }
    }

    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return { ok: res.ok, status: res.status, json }
  } catch (err) {
    return { ok: false, status: 0, reason: err?.name === 'AbortError' ? 'timeout' : 'network' }
  } finally {
    clearTimeout(timer)
  }
}