export const ADVISORY_CATEGORIES = [
  { key: 'power_interruption', label: 'Power Interruption',   timed: true,  tone: 'amber' },
  { key: 'power_rates',        label: 'Power Rates',          timed: false, tone: 'green' },
  { key: 'collection_payment', label: 'Collection & Payment', timed: false, tone: 'blue' },
  { key: 'programs',           label: 'Programs & Activities',timed: false, tone: 'purple' },
  { key: 'announcement',       label: 'General Announcement', timed: false, tone: 'gray' },
]
export const ALL_DAY = { start: '00:00', end: '23:59' }
export const categoryOf = (key) =>
  ADVISORY_CATEGORIES.find((c) => c.key === key) || ADVISORY_CATEGORIES[0]