import { ISSUE_LABELS } from '@/lib/issueCodes'

// values and setters use the same names as the page's state:
// values:  { municipality, barangay, feeder, areaOffice, category, priority, status }
// setters: { setMunicipality, setBarangay, setFeeder, setAreaOffice, setCategory, setPriority, setStatus }
export function buildReportFilters({ values, setters, options, priorityLevels, statusLabel }) {
  const { municipality, barangay, feeder, areaOffice, category, priority, status } = values
  const {
    setMunicipality,
    setBarangay,
    setFeeder,
    setAreaOffice,
    setCategory,
    setPriority,
    setStatus,
  } = setters

  return [
    {
      key: 'municipality',
      label: 'Municipality',
      value: municipality,
      onChange: (v) => {
        setMunicipality(v)
        setBarangay('all')
      },
      options: [
        { value: 'all', label: 'All Municipalities' },
        ...(options?.municipalities || []).map((m) => ({ value: m, label: m })),
      ],
    },
    {
      key: 'barangay',
      label: 'Barangay',
      value: barangay,
      onChange: setBarangay,
      options: [
        { value: 'all', label: 'All Barangays' },
        ...(options?.barangays || []).filter(
          (b) => municipality === 'all' || b.value.endsWith(`|${municipality}`)
        ),
      ],
    },
    {
      key: 'feeder',
      label: 'Feeder',
      value: feeder,
      onChange: setFeeder,
      options: [
        { value: 'all', label: 'All Feeders' },
        ...(options?.feeders || []).map((f) => ({ value: f, label: f })),
      ],
    },
    {
      key: 'areaOffice',
      label: 'Area Office',
      value: areaOffice,
      onChange: setAreaOffice,
      options: [
        { value: 'all', label: 'All Area Offices' },
        ...(options?.areaOffices || []).map((a) => ({ value: a, label: a })),
      ],
    },
    {
      key: 'category',
      label: 'Category',
      value: category,
      onChange: setCategory,
      options: [
        { value: 'all', label: 'All Categories' },
        ...Object.entries(ISSUE_LABELS).map(([code, label]) => ({ value: code, label })),
        { value: 'uncategorized', label: 'Uncategorized' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      value: priority,
      onChange: setPriority,
      options: [
        { value: 'all', label: 'All Priorities' },
        ...priorityLevels.map((p) => ({ value: p.key, label: p.label })),
        { value: 'none', label: 'Not set' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      value: status,
      onChange: setStatus,
      options: [
        { value: 'all', label: 'All Statuses' },
        ...['pending', 'dispatched', 'in_progress', 'qa_review', 'resolved', 'cancelled'].map((k) => ({
          value: k,
          label: statusLabel(k),
        })),
      ],
    },
  ]
}