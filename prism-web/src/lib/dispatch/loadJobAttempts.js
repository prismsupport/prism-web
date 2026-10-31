// Job Order History
export async function loadJobAttempts(supabase, assignmentList) {
  const linemanIds = Array.from(new Set(assignmentList.map((a) => a.lineman_id)))
  const linemenMap = {}
  if (linemanIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', linemanIds)
    ;(data || []).forEach((u) => {
      linemenMap[u.id] = `${u.first_name} ${u.last_name}`
    })
  }

  const attempts = []
  for (const [index, a] of assignmentList.entries()) {
    const { data: logs } = await supabase
      .from('job_assignment_status_logs')
      .select('*')
      .eq('assignment_id', a.assignment_id)
      .order('changed_at', { ascending: true })

    const { data: review } = await supabase
      .from('qa_reviews')
      .select('*')
      .eq('assignment_id', a.assignment_id)
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let photoUrl = null
    if (a.photo_url) {
      const { data: signed } = await supabase.storage
        .from('assignment-proofs')
        .createSignedUrl(a.photo_url, 3600)
      if (signed) photoUrl = signed.signedUrl
    }

    attempts.push({
      ...a,
      attemptNumber: index + 1,
      isCurrent: index === assignmentList.length - 1,
      linemanName: linemenMap[a.lineman_id] || 'Unknown',
      logs: logs || [],
      review,
      photoUrl,
    })
  }
  return attempts
}
