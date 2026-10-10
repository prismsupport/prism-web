// Returns an error message, or '' if the schedule is fine.
export function validateSchedule(blocks) {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const label = `Shift ${i + 1}`
    if (!b.name.trim()) return `${label}: enter a shift name.`
    if (!b.start || !b.end) return `${label}: set a start and end time.`
    if (b.start === b.end) return `${label}: start and end time cannot be the same.`
    if (!b.days || b.days.length === 0) return `${label}: pick at least one duty day.`
  }
  return ''
}

// The exact shape that gets saved in lineman.schedule
export function cleanSchedule(blocks) {
  return blocks.map((b) => ({
    name: b.name.trim(),
    start: b.start.slice(0, 5),
    end: b.end.slice(0, 5),
    days: [...b.days].sort((a, c) => a - c),
  }))
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // Monday first, Sunday last
const DAY_SHORT = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }

function formatTime(value) {
  const [h, m] = value.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

// [5, 6, 0] -> "Fri–Sun", [1, 2] -> "Mon, Tue", all seven -> "Daily"
function formatDays(days) {
  if (days.length === 7) return 'Daily'

  const positions = WEEK_ORDER.map((d, i) => (days.includes(d) ? i : -1)).filter(
    (i) => i !== -1
  )

  const runs = []
  let start = null
  let prev = null
  for (const p of positions) {
    if (start === null) {
      start = p
      prev = p
    } else if (p === prev + 1) {
      prev = p
    } else {
      runs.push([start, prev])
      start = p
      prev = p
    }
  }
  if (start !== null) runs.push([start, prev])

  return runs
    .map(([a, b]) => {
      const first = DAY_SHORT[WEEK_ORDER[a]]
      const last = DAY_SHORT[WEEK_ORDER[b]]
      if (a === b) return first
      if (b === a + 1) return `${first}, ${last}`
      return `${first}–${last}`
    })
    .join(', ')
}

// For display in tables: one entry per shift block
export function summarizeSchedule(schedule) {
  return (schedule || []).map((b) => ({
    name: b.name,
    time: `${formatTime(b.start)}–${formatTime(b.end)}`,
    days: formatDays(b.days),
  }))
}