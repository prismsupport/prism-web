import { createClient } from '@/lib/supabase/client'

// Used consistently by: QA rejecting a "fixed" job, the manual "Re-open
// Ticket" button, and an approved consumer reopen request. Always creates
// a fresh assignment row (never mutates the old one), so every past cycle
// stays intact as real history.
export async function reopenAssignment({ reportId, masterId, linemanId }) {
  const supabase = createClient()

  const { error: assignError } = await supabase.from('job_assignments').insert({
    report_id: reportId || null,
    master_id: masterId || null,
    lineman_id: linemanId,
    status: 'assigned',
    assigned_at: new Date().toISOString(),
  })

  if (assignError) return { error: assignError.message }

  if (reportId) {
    const { error: reportError } = await supabase
      .from('reports')
      .update({ reopened_at: new Date().toISOString() })
      .eq('report_id', reportId)

    if (reportError) return { error: reportError.message }
  }

  if (masterId) {
    const { error: masterError } = await supabase
      .from('master_tickets')
      .update({ reopened_at: new Date().toISOString() })
      .eq('master_id', masterId)

    if (masterError) return { error: masterError.message }
  }

  return { error: null }
}