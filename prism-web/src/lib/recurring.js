// Recurring issues: a rule-based flag, no machine learning.
// An issue is "recurring" when RECURRING_MIN_REPORTS or more reports share the
// same category in the same barangay (and municipality) within the last
// RECURRING_WINDOW_DAYS days. These numbers were chosen for simplicity and
// explainability, not measured from cooperative data.
// "Other Concern" is never counted, because it is a catch-all, not one problem.

import { issueLabel } from '@/lib/issueCodes'

export const RECURRING_MIN_REPORTS = 3
export const RECURRING_WINDOW_DAYS = 30

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

export function recurringSinceIso() {
  const d = new Date()
  d.setDate(d.getDate() - RECURRING_WINDOW_DAYS)
  return d.toISOString()
}

export function recurringKey(code, barangay, municipality) {
  if (!code || code === 'other' || !barangay) return null
  return `${code}|${norm(barangay)}|${norm(municipality)}`
}

// Every report in the window, including reports already merged into a Master
// Ticket (declined reports are left out). Read-only, own cooperative only.
export async function loadRecentIssueReports(supabase, coopId) {
  const { data } = await supabase
    .from('reports')
    .select('issue_code, barangay, municipality, created_at')
    .eq('cooperative_id', coopId)
    .not('issue_code', 'is', null)
    .neq('status', 'cancelled')
    .gte('created_at', recurringSinceIso())
    .limit(1000)
  return data || []
}

// Returns { counts: Map(key -> number of reports), groups: [...] }
// groups only holds the combinations that reach the minimum, biggest first.
export function buildRecurringGroups(rows) {
  const counts = new Map()
  const samples = new Map()
  ;(rows || []).forEach((r) => {
    const key = recurringKey(r.issue_code, r.barangay, r.municipality)
    if (!key) return
    counts.set(key, (counts.get(key) || 0) + 1)
    if (!samples.has(key)) samples.set(key, r)
  })

  const groups = []
  counts.forEach((count, key) => {
    if (count < RECURRING_MIN_REPORTS) return
    const s = samples.get(key)
    groups.push({
      key,
      count,
      code: s.issue_code,
      label: issueLabel(s.issue_code),
      barangay: s.barangay,
      municipality: s.municipality,
    })
  })
  groups.sort((a, b) => b.count - a.count)
  return { counts, groups }
}

// How many reports share this category and place (0 when it cannot be grouped)
export function recurringCountFor(counts, code, barangay, municipality) {
  const key = recurringKey(code, barangay, municipality)
  return key ? counts.get(key) || 0 : 0
}