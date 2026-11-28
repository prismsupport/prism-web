import { computeStageTimes, averageStages } from '@/lib/stageTimes'
import { summarizeRatings } from '@/lib/performance'
import { chunk } from '@/lib/reports/reportQueries'
import { average } from '@/lib/reports/summarize'

// ---- Lineman performance (only jobs on the filtered tickets) ----
export async function loadLinemen(supabase, coopId, assignmentsByTicket) {
  const resolvedAssignments = []
  Object.values(assignmentsByTicket).forEach((list) => {
    list.forEach((a) => {
      if (a.status === 'resolved' && a.completed_at) resolvedAssignments.push(a)
    })
  })

  const { data: linemenUsers } = await supabase
    .from('users')
    .select('id, first_name, last_name, is_active')
    .eq('cooperative_id', coopId)
    .eq('user_type', 'lineman')
  const linemanIds = (linemenUsers || []).map((l) => l.id)

  let officeRows = []
  if (linemanIds.length > 0) {
    const { data } = await supabase
      .from('lineman')
      .select('profile_id, assigned_area_office')
      .in('profile_id', linemanIds)
    officeRows = data || []
  }

  let ratingRows = []
  const ratingChunks = await Promise.all(
    chunk(
      resolvedAssignments.map((a) => a.assignment_id),
      100
    ).map((ids) => supabase.from('job_ratings').select('assignment_id, lineman_id, rating').in('assignment_id', ids))
  )
  ratingChunks.forEach((res) => {
    ratingRows = ratingRows.concat(res.data || [])
  })

  return (linemenUsers || [])
    .map((l) => {
      const done = resolvedAssignments.filter((a) => a.lineman_id === l.id)
      const repair = done
        .map((a) => (new Date(a.completed_at) - new Date(a.assigned_at)) / 60000)
        .filter((m) => m >= 0)
      const stages = averageStages(done.map((a) => computeStageTimes(a, a.job_assignment_status_logs)))
      return {
        id: l.id,
        name: `${l.first_name} ${l.last_name}`,
        isActive: l.is_active,
        areaOffice: officeRows.find((o) => o.profile_id === l.id)?.assigned_area_office || null,
        jobsCompleted: done.length,
        avgRepair: average(repair),
        avgTravel: stages.travel,
        avgOnSite: stages.onSite,
        ...summarizeRatings(ratingRows.filter((r) => r.lineman_id === l.id)),
      }
    })
    .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
}