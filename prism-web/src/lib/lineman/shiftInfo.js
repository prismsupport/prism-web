// Shift info for linemen (from get_lineman_shift_info). Display helpers only.

export async function loadShiftInfo(supabase) {
  const { data } = await supabase.rpc('get_lineman_shift_info')
  const map = {}
  ;(data || []).forEach((r) => {
    map[r.lineman_id] = r
  })
  return map
}

const SOON_MINUTES = 60

// Returns { text, tone } or null when there is nothing worth showing
export function shiftBadge(info, now = Date.now()) {
  if (!info || (!info.has_schedule && !info.on_call)) return null
  if (!info.on_shift && !info.on_call) return { text: 'OFF SCHEDULE', tone: 'gray' }
  if (!info.shift_ends_at) return null
  const mins = Math.round((new Date(info.shift_ends_at).getTime() - now) / 60000)
  if (mins <= SOON_MINUTES) return { text: `SHIFT ENDS IN ${Math.max(mins, 0)} MIN`, tone: 'amber' }
  const time = new Date(info.shift_ends_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
  return { text: `ON DUTY UNTIL ${time}`, tone: 'green' }
}

// True when the lineman is scheduled but outside their shift and not on call
export function isOffDuty(info) {
  return !!info && info.has_schedule && !info.on_shift && !info.on_call
}