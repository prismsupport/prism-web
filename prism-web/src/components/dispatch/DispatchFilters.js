import { FilterBar } from '@/components/ui/FilterBar'
import { FilterMenu, FilterChips } from '@/components/ui/FilterMenu'
import SearchInput from '@/components/ui/SearchInput'
import { buttonClasses } from '@/components/ui/Button'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import { ISSUE_LABELS } from '@/lib/issueCodes'

export const DATE_RANGES = [
  { key: 'all', label: 'Any time', days: null },
  { key: '1', label: 'Last 24 hours', days: 1 },
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
]

export default function DispatchFilters({
  searchText,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  municipalityFilter,
  onMunicipalityChange,
  municipalityOptions,
  assigneeFilter,
  onAssigneeChange,
  assigneeOptions, // [{ id, name }]
  rangeKey,
  onRangeChange,
  onSettings,
}) {
  const { statusLabel, priorityLevels } = useStatusLabels()

  const filters = [
    {
      key: 'category',
      label: 'Category',
      value: categoryFilter,
      onChange: onCategoryChange,
      options: [
        { value: 'all', label: 'All Categories' },
        ...Object.entries(ISSUE_LABELS).map(([code, label]) => ({ value: code, label })),
        { value: 'uncategorized', label: 'Uncategorized' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      value: priorityFilter,
      onChange: onPriorityChange,
      options: [
        { value: 'all', label: 'All Priorities' },
        ...priorityLevels.map((p) => ({ value: p.key, label: p.label })),
      ],
    },
    {
      key: 'status',
      label: 'Job Order Status',
      value: statusFilter,
      onChange: onStatusChange,
      options: [
        { value: 'all', label: 'All Statuses' },
        ...statusOptions.map((s) => ({ value: s, label: statusLabel(s) })),
        { value: 'cancelled', label: statusLabel('cancelled') },
        { value: 'overdue', label: 'Overdue (response time exceeded)' },
      ],
    },
    {
      key: 'municipality',
      label: 'Municipality',
      value: municipalityFilter,
      onChange: onMunicipalityChange,
      options: [
        { value: 'all', label: 'All Municipalities' },
        ...municipalityOptions.map((m) => ({ value: m, label: m })),
      ],
    },
    {
      key: 'assignee',
      label: 'Assignee',
      value: assigneeFilter,
      onChange: onAssigneeChange,
      options: [
        { value: 'all', label: 'All Linemen' },
        { value: 'unassigned', label: 'Unassigned' },
        ...assigneeOptions.map((a) => ({ value: a.id, label: a.name })),
      ],
    },
    {
      key: 'reported',
      label: 'Reported',
      value: rangeKey,
      onChange: onRangeChange,
      options: DATE_RANGES.map((r) => ({ value: r.key, label: r.label })),
    },
  ]

  return (
    <FilterBar className="flex items-center">
      <SearchInput
        className="flex-1 min-w-[200px]"
        value={searchText}
        onChange={onSearchChange}
        placeholder="Search ticket no., landmark, barangay, municipality, lineman…"
      />
      <div className="flex items-center gap-2">
        <FilterMenu filters={filters} />
        <button
          type="button"
          onClick={onSettings}
          aria-label="Open dispatch settings"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.6.68 1 1.3 1H21a2 2 0 1 1 0 4h-.3a1.65 1.65 0 0 0-1.3 1Z" />
          </svg>
          Settings
        </button>
      </div>
      <a
        href="/supervisor/dispatch/create-master-ticket"
        className={buttonClasses({ dim: false, className: 'inline-block whitespace-nowrap' })}
      >
        + Create Master Ticket
      </a>
      <FilterChips filters={filters} />
    </FilterBar>
  )
}