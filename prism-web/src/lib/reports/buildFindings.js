import { STAGES, slowestStageKey, formatDuration } from '@/lib/stageTimes'
import { formatMinutes } from '@/lib/performance'

function signed(pct) {
  return `${pct > 0 ? '+' : ''}${pct}%`
}

// Plain sentences built from the numbers. Rule-based, no AI.
export function buildFindings(data, comparison) {
  const s = data.summary
  const out = []
  if (s.totalReports === 0) return ['No outage reports match this selection.']

  const topIssue = data.issues[0]
  if (topIssue) {
    out.push(`Most common issue: ${topIssue[0]} (${topIssue[1]} of ${s.totalReports} reports).`)
  }
  const topBarangay = data.locations.barangay[0]
  if (topBarangay) out.push(`Most affected barangay: ${topBarangay[0]} (${topBarangay[1]} reports).`)
  const topFeeder = data.locations.feeder.find(([name]) => name !== 'Unmapped')
  if (topFeeder) out.push(`Most affected feeder: ${topFeeder[0]} (${topFeeder[1]} reports).`)

  if (s.responsePct != null && s.thresholdMinutes) {
    out.push(`${s.responsePct}% of tickets were dispatched within the ${s.thresholdMinutes}-minute response limit.`)
  }
  if (s.resolutionPct != null && s.targetMinutes) {
    out.push(`${s.resolutionPct}% of resolved tickets met the ${formatMinutes(s.targetMinutes)} resolution target.`)
  }

  const slowest = slowestStageKey(data.stageAverages)
  if (slowest) {
    const stage = STAGES.find((st) => st.key === slowest)
    out.push(`Slowest stage: ${stage.label}, averaging ${formatDuration(data.stageAverages[slowest])}.`)
  }
  if (data.recurring.length > 0) {
    const g = data.recurring[0]
    out.push(`${data.recurring.length} recurring incident group(s); the largest is ${g.label} in ${g.barangay} (${g.count} reports).`)
  }
  if (data.consolidation.dispatchesAvoided > 0) {
    out.push(`Master Tickets avoided ${data.consolidation.dispatchesAvoided} duplicate dispatch(es).`)
  }
  if (comparison?.deltas.totalReports.pct != null) {
    out.push(`Reports are ${signed(comparison.deltas.totalReports.pct)} compared with the previous period.`)
  }
  return out
}