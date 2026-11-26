export const ADVISORY_CATEGORIES = [
  { key: 'power_interruption',       label: 'Scheduled Power Interruption',   timed: true,  endOptional: false, tone: 'amber' },
  { key: 'unscheduled_interruption', label: 'Unscheduled Power Interruption', timed: true,  endOptional: true,  tone: 'red' },
  { key: 'power_rates',              label: 'Power Rates',           timed: false, tone: 'green' },
  { key: 'collection_payment',       label: 'Collection & Payment',  timed: false, tone: 'blue' },
  { key: 'programs',                 label: 'Programs & Activities', timed: false, tone: 'purple' },
  { key: 'announcement',             label: 'General Announcement',  timed: false, tone: 'gray' },
]
export const ALL_DAY = { start: '00:00', end: '23:59' }
// Categories that block outage reporting while ongoing
export const INTERRUPTION_KEYS = ['power_interruption', 'unscheduled_interruption']
export const categoryOf = (key) =>
  ADVISORY_CATEGORIES.find((c) => c.key === key) || ADVISORY_CATEGORIES[0]