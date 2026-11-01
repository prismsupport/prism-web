export const STAGES = [
  { key: 'waiting', label: 'Waiting for dispatch', hint: 'Report submitted to lineman assigned' },
  { key: 'dispatchToStart', label: 'Dispatch to start', hint: 'Lineman assigned to Start Task' },
  { key: 'travel', label: 'Travel to site', hint: 'Start Task to arrival at the site' },
  { key: 'onSite', label: 'Repair on site', hint: 'Arrival to marked Fixed' },
  { key: 'approval', label: 'Awaiting approval', hint: 'Marked Fixed to supervisor approval' },
]

function toMs(value) {
  if (!value) return null
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? null : t
}

function minutesBetween(from, to) {
  const a = toMs(from)
  const b = toMs(to)
  if (a == null || b == null) return null
  const minutes = (b - a) / 60000
  return minutes >= 0 ? minutes : null
}

function firstLogTime(logs, status) {
  const times = (logs || [])
    .filter((l) => l.new_status === status && l.changed_at)
    .map((l) => toMs(l.changed_at))
    .filter((t) => t != null)
    .sort((a, b) => a - b)
  return times.length > 0 ? new Date(times[0]).toISOString() : null
}

export function computeStageTimes(assignment, logs, ticketStart = null) {
  const dispatched = assignment?.assigned_at || null

  const started = firstLogTime(logs, 'on_the_way')
  const arrived = firstLogTime(logs, 'arrived_at_site') || firstLogTime(logs, 'in_progress')
  const fixed = firstLogTime(logs, 'fixed')

  const notResolved = assignment?.status && assignment.status !== 'resolved'
  const approved = notResolved
    ? null
    : assignment?.completed_at || firstLogTime(logs, 'resolved')

  return {
    waiting: ticketStart ? minutesBetween(ticketStart, dispatched) : null,
    dispatchToStart: minutesBetween(dispatched, started),
    travel: minutesBetween(started, arrived),
    onSite: minutesBetween(arrived, fixed),
    approval: minutesBetween(fixed, approved),
    total: minutesBetween(ticketStart || dispatched, approved),
  }
}

export function averageStages(rows) {
  const result = {}
  STAGES.forEach(({ key }) => {
    const values = (rows || []).map((r) => r[key]).filter((v) => v != null)
    result[key] = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null
  })
  return result
}

export function slowestStageKey(stages) {
  let best = null
  STAGES.forEach(({ key }) => {
    const v = stages[key]
    if (v != null && (best === null || v > stages[best])) best = key
  })
  return best
}

export function formatDuration(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return '—'
  if (minutes < 1) return '<1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const totalHours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (totalHours < 24) return `${totalHours}h ${mins}m`
  const days = Math.floor(totalHours / 24)
  return `${days}d ${totalHours % 24}h`
}