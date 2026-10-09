// Encrypts and decrypts the billing API key before it is stored.
// Uses AES-256-GCM with a secret that lives only in the server environment
// (BILLING_CONFIG_SECRET), so a database export alone does not reveal keys.
//
// Server-only: never import this from a client component.

import crypto from 'crypto'

function getKey() {
  const hex = process.env.BILLING_CONFIG_SECRET
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('BILLING_CONFIG_SECRET must be exactly 64 hex characters.')
  }
  return Buffer.from(hex, 'hex')
}

// Output format: iv.tag.ciphertext (each part base64)
export function encryptSecret(plainText) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map((part) => part.toString('base64')).join('.')
}

export function decryptSecret(payload) {
  const [ivB64, tagB64, dataB64] = String(payload ?? '').split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed secret.')

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}