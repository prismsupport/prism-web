// Concern categories saved by the mobile report form in reports.issue_code.
// Older reports have no code and are shown as "Uncategorized".

export const ISSUE_LABELS = {
  no_power: 'No Power / Total Power Interruption',
  partial_power: 'Partial Power Interruption',
  frequent_interruptions: 'Frequent Power Interruptions',
  low_voltage: 'Low Voltage / Weak Power Supply',
  damaged_power_lines: 'Damaged Power Lines',
  damaged_electric_post: 'Fallen or Damaged Electric Post',
  sparks_or_unusual_sounds: 'Sparks or Unusual Equipment Sounds',
  other: 'Other Concern',
}

export function issueLabel(code) {
  if (!code) return 'Uncategorized'
  if (ISSUE_LABELS[code]) return ISSUE_LABELS[code]
  const text = String(code).replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}