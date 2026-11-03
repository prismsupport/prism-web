export function normalizeAccountNumber(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}