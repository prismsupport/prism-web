// Rule-based matching used to cross-check a consumer's billing linkage
// request against the cooperative's billing record.
// No AI: the system compares, the supervisor decides.

export function normalizeAccountNumber(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

function nameTokens(value) {
  return String(value ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strips accents, e.g. Ñ -> N
    .replace(/[^A-Z\s]/g, ' ')       // drops commas, periods, digits
    .split(/\s+/)
    .filter(Boolean)
}

// True when two words are identical, or differ by at most one letter
// (a typo). One-letter tolerance only applies to words of 5+ letters,
// so short words like "ANA" vs "ANI" are not treated as the same.
function withinOneEdit(a, b) {
  if (a === b) return true
  if (a.length < 5 || b.length < 5) return false
  if (Math.abs(a.length - b.length) > 1) return false

  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    edits++
    if (edits > 1) return false
    if (a.length > b.length) i++
    else if (a.length < b.length) j++
    else {
      i++
      j++
    }
  }
  edits += a.length - i + (b.length - j)
  return edits <= 1
}

function wordsAlike(token, other) {
  return (
    withinOneEdit(token, other) ||
    (token.length === 1 && other.startsWith(token)) ||
    (other.length === 1 && token.startsWith(other))
  )
}

// Returns 'match' | 'similar' | 'mismatch' | 'unknown'
//   match    - exactly the same words (order does not matter:
//              "DELA CRUZ, JUAN" = "JUAN DELA CRUZ")
//   similar  - one name is a shorter form of the other (middle name or
//              initial missing: "JUAN D CRUZ" ~ "JUAN DELA CRUZ"), or
//              words differ by a one-letter typo ("JULINNA" ~ "JULIANNA")
//   mismatch - different names, or too little to compare
export function compareNames(a, b) {
  const ta = nameTokens(a)
  const tb = nameTokens(b)
  if (ta.length === 0 || tb.length === 0) return 'unknown'

  if ([...ta].sort().join(' ') === [...tb].sort().join(' ')) return 'match'

  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  if (short.length < 2) return 'mismatch'

  const used = new Set()
  const covered = short.every((token) => {
    const idx = long.findIndex((other, i) => !used.has(i) && wordsAlike(token, other))
    if (idx === -1) return false
    used.add(idx)
    return true
  })

  return covered ? 'similar' : 'mismatch'
}