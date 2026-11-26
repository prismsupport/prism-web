export const MAX_ROWS = 1000 // Supabase returns at most 1000 rows per request

export const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'insights', label: 'Insights' },
  { key: 'performance', label: 'Performance' },
]

export const RANGES = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
]

export const STATUS_CARDS = [
  { key: 'pending', label: 'Pending', color: 'text-red-600' },
  { key: 'dispatched', label: 'Dispatched', color: 'text-amber-600' },
  { key: 'in_progress', label: 'In Progress', color: 'text-green-600' },
  { key: 'qa_review', label: 'QA Review', color: 'text-blue-700' },
  { key: 'resolved', label: 'Resolved', color: 'text-gray-900' },
]

export const FEATURE_LABELS = {
  dispatch: 'Dispatch, Reports and Lineman Performance',
  advisories: 'Advisories and Service Areas',
  faq: 'FAQ',
}