export const TABS = [
  { key: 'lineman', label: 'Personnel (Lineman)' },
  { key: 'consumer', label: 'Consumer Accounts' },
  { key: 'supervisor', label: 'Supervisors' },
]

export const LINEMAN_COLUMNS = [
  'Name',
  'Assigned Area Office',
  'Shift',
  'Duty Status',
  'Contact Number',
  'Action',
].map((label) => ({ label, className: 'text-center' }))

export const CONSUMER_COLUMNS = [
  'Name',
  'Contact Number',
  'Account Number',
  'Zone',
  'Barangay',
  'Municipality',
  'Action',
].map((label) => ({ label, className: 'text-center' }))

export const SUPERVISOR_COLUMNS = [
  'Name',
  'Access',
  'Contact Number',
  'Action',
].map((label) => ({ label, className: 'text-center' }))