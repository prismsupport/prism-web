export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  const raw = typeof error === 'string' ? error : error?.message || ''
  if (!raw.trim()) return fallback
  const m = raw.toLowerCase()

  if (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('load failed')
  ) {
    return 'Could not reach the server. Check your internet connection and try again.'
  }
  if (m.includes('jwt expired') || m.includes('invalid jwt') || m.includes('not authenticated')) {
    return 'Your session has expired. Please log in again.'
  }
  if (m.includes('permission denied') || m.includes('row-level security')) {
    return "You don't have permission to do that."
  }
  if (m.includes('duplicate key')) {
    return 'That entry already exists. Please use a different value.'
  }
  if (m.includes('violates foreign key')) {
    return 'This record is still in use elsewhere, so the change was not saved.'
  }
  if (m.includes('violates check constraint') || m.includes('invalid input syntax')) {
    return 'One of the values is not valid. Please check the form and try again.'
  }
  if (m.includes('timed out') || m.includes('statement timeout')) {
    return 'The request took too long. Please try again.'
  }
  return raw
}