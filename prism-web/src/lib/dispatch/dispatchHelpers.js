// Pure helpers for the Dispatch page.

// Status filters the Dispatch page accepts from the URL, e.g. ?status=qa_review
export const VALID_STATUS_FILTERS = [
  'pending',
  'dispatched',
  'in_progress',
  'qa_review',
  'resolved',
  'cancelled',
  'overdue',
]

// Which status card a job order step counts under
export const ASSIGNMENT_TO_BUCKET = {
  assigned: 'dispatched',
  on_the_way: 'dispatched',
  arrived_at_site: 'in_progress',
  in_progress: 'in_progress',
  fixed: 'qa_review',
  resolved: 'resolved',
}

// Groups join suggestions by their target (Master Ticket or report),
// keeping the report ids and the best score for each target.
export function buildJoinGroups(joinSuggestions) {
  return Object.values(
    joinSuggestions.reduce((acc, s) => {
      const key = `${s.target_type}-${s.target_id}`
      if (!acc[key]) {
        acc[key] = {
          target_type: s.target_type,
          target_id: s.target_id,
          target_label: s.target_label,
          reportIds: [],
          maxScore: 0,
        }
      }
      acc[key].reportIds.push(s.report_id)
      acc[key].maxScore = Math.max(acc[key].maxScore, s.score)
      return acc
    }, {})
  )
}

// rows = [{ master_id, issue_code }]. A Master Ticket takes the most common
// category among its reports. Returns { master_id: issue_code }.
export function dominantIssueByMaster(rows) {
  const tally = {}
  ;(rows || []).forEach((m) => {
    tally[m.master_id] = tally[m.master_id] || {}
    tally[m.master_id][m.issue_code] = (tally[m.master_id][m.issue_code] || 0) + 1
  })
  const dominant = {}
  Object.entries(tally).forEach(([masterId, codes]) => {
    dominant[masterId] = Object.entries(codes).sort((a, b) => b[1] - a[1])[0][0]
  })
  return dominant
}