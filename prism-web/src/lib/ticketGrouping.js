// Shared helpers for the Master Ticket pages: loading report categories,
// grouping reports by category, and searching. Read-only.

import { issueLabel } from '@/lib/issueCodes'

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

// { report_id: issue_code | null }
export async function loadIssueCodes(supabase, reportIds) {
  const ids = Array.from(new Set((reportIds || []).filter(Boolean)))
  const out = {}
  const results = await Promise.all(
    chunk(ids, 100).map((part) =>
      supabase.from('reports').select('report_id, issue_code').in('report_id', part)
    )
  )
  results.forEach((res) => {
    ;(res.data || []).forEach((row) => {
      out[row.report_id] = row.issue_code || null
    })
  })
  return out
}

// { user_id: 'First Last' }
export async function loadConsumerNames(supabase, consumerIds) {
  const ids = Array.from(new Set((consumerIds || []).filter(Boolean)))
  const out = {}
  const results = await Promise.all(
    chunk(ids, 100).map((part) =>
      supabase.from('users').select('id, first_name, last_name').in('id', part)
    )
  )
  results.forEach((res) => {
    ;(res.data || []).forEach((u) => {
      out[u.id] = `${u.first_name} ${u.last_name}`
    })
  })
  return out
}

// The most common category among the reports of a Master Ticket (null if none)
export async function loadDominantCategory(supabase, masterId) {
  const { data } = await supabase
    .from('reports')
    .select('issue_code')
    .eq('master_id', masterId)
    .not('issue_code', 'is', null)
  const tally = {}
  ;(data || []).forEach((r) => {
    tally[r.issue_code] = (tally[r.issue_code] || 0) + 1
  })
  const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : null
}

export function categoryKey(code) {
  return code || 'uncategorized'
}

export function sameCategory(a, b) {
  return categoryKey(a) === categoryKey(b)
}

export function matchesSearch(parts, term) {
  const t = String(term || '').trim().toLowerCase()
  if (!t) return true
  return parts.filter(Boolean).join(' ').toLowerCase().includes(t)
}

// items = [{ code, score, created, ...anything }]
// Groups by category. Inside a group: highest match percentage first.
// With a reference (anchor or existing ticket): its category comes first, then the
// other groups with the best top score first. Without one: biggest group first.
export function groupByCategory(items, { anchorCode = null, hasAnchor = false } = {}) {
  const map = new Map()
  items.forEach((it) => {
    const key = categoryKey(it.code)
    if (!map.has(key)) {
      map.set(key, {
        key,
        code: it.code || null,
        label: issueLabel(it.code),
        matchesAnchor: hasAnchor && key === categoryKey(anchorCode),
        items: [],
      })
    }
    map.get(key).items.push(it)
  })

  const groups = Array.from(map.values())
  groups.forEach((g) => {
    g.items.sort(
      (a, b) =>
        (b.score ?? -1) - (a.score ?? -1) ||
        new Date(b.created || 0) - new Date(a.created || 0)
    )
  })

  groups.sort((a, b) => {
    if (a.matchesAnchor !== b.matchesAnchor) return a.matchesAnchor ? -1 : 1
    if (hasAnchor) {
      const topA = a.items[0]?.score ?? -1
      const topB = b.items[0]?.score ?? -1
      return topB - topA || b.items.length - a.items.length
    }
    return b.items.length - a.items.length
  })

  return groups
}