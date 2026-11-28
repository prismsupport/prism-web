const PAGE = 1000 // Supabase returns at most 1000 rows per request
const MAX_PAGES = 20 // safety cap: 20,000 rows per query

// Runs a query page by page so long date ranges are not cut off at 1000 rows.
export async function fetchAll(makeQuery) {
  const rows = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE
    const { data, error } = await makeQuery().range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data || []))
    if (!data || data.length < PAGE) return { rows, truncated: false }
  }
  return { rows, truncated: true }
}

export function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

// ---- Reports in the period (paged) ----
export function buildReportQuery(supabase, coopId, filters, fromIso, toIso) {
  let q = supabase
    .from('reports')
    .select('report_id, ticket_number, status, priority, barangay, municipality, created_at, master_id, reopened_at, issue_code')
    .eq('cooperative_id', coopId)
    .order('created_at', { ascending: false })
    .order('report_id', { ascending: true })
  if (fromIso) q = q.gte('created_at', fromIso)
  if (toIso) q = q.lte('created_at', toIso)
  if (filters.municipality && filters.municipality !== 'all') {
    q = q.eq('municipality', filters.municipality)
  }
  if (filters.barangay && filters.barangay !== 'all') {
    const [b, m] = filters.barangay.split('|')
    q = q.eq('barangay', b).eq('municipality', m)
  }
  if (filters.category && filters.category !== 'all') {
    q = filters.category === 'uncategorized' ? q.is('issue_code', null) : q.eq('issue_code', filters.category)
  }
  if (filters.priority && filters.priority !== 'all') {
    q = filters.priority === 'none' ? q.is('priority', null) : q.eq('priority', filters.priority)
  }
  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }
  return q
}

// ---- Assignments dispatched on or after the period start (paged) ----
// No upper limit: a ticket filed late in the period may be dispatched after it.
export function buildAssignmentQuery(supabase, fromIso) {
  let q = supabase
    .from('job_assignments')
    .select(
      'assignment_id, report_id, master_id, lineman_id, status, assigned_at, completed_at, reopen_source, job_assignment_status_logs(new_status, changed_at)'
    )
    .order('assigned_at', { ascending: false })
    .order('assignment_id', { ascending: true })
  if (fromIso) q = q.gte('assigned_at', fromIso)
  return q
}