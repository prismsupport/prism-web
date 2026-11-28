import { createClient } from '@/lib/supabase/client'

// Transfers an unfinished job order to another lineman (supervisor decision).
// Returns { error, newAssignmentId }.
export async function transferAssignment({ assignmentId, newLinemanId, reason }) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('transfer_assignment', {
    p_assignment_id: assignmentId,
    p_new_lineman_id: newLinemanId,
    p_reason: String(reason ?? '').trim(),
  })
  if (error) return { error: error.message, newAssignmentId: null }
  return { error: null, newAssignmentId: data }
}