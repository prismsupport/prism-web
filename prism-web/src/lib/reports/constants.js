export const RANGES = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
  { key: 'custom', label: 'Custom' },
]

// One tab at a time instead of one long page. Exports still include every section.
export const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'locations', label: 'Locations' },
  { key: 'times', label: 'Response & Resolution' },
  { key: 'linemen', label: 'Lineman Performance' },
]

export const LINEMAN_COLUMNS = [
  { label: 'Lineman', className: 'text-center' },
  { label: 'Area Office', className: 'text-center' },
  { label: 'Jobs Completed', className: 'text-center' },
  { label: 'Avg. Repair Time', className: 'text-center' },
  { label: 'Avg. Travel', className: 'text-center' },
  { label: 'Avg. On-site', className: 'text-center' },
  { label: 'Avg. Rating', className: 'text-center' },
  { label: 'Ratings', className: 'text-center' },
]

export const REOPEN_LABELS = {
  consumer: 'Consumer request',
  supervisor: 'Supervisor',
  qa_rejection: 'QA rejection',
}

// Same colours as the Dashboard status bar
export const STATUS_BAR = {
  pending: 'bg-red-500',
  dispatched: 'bg-amber-400',
  in_progress: 'bg-orange-500',
  qa_review: 'bg-blue-600',
  resolved: 'bg-green-500',
  cancelled: 'bg-gray-300',
}