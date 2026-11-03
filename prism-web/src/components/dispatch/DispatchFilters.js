import { FilterBar, FilterSelect } from '@/components/ui/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import { buttonClasses } from '@/components/ui/Button'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import { ISSUE_LABELS } from '@/lib/issueCodes'

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
  onClear,
  hasActiveFilters,
}) {
  const { statusLabel, priorityLevels } = useStatusLabels()
  return (
    <FilterBar className="flex items-center">
      <SearchInput
        className="flex-1 min-w-[240px] basis-full"
        value={searchText}
        onChange={onSearchChange}
        placeholder="Search ticket no., landmark, barangay, municipality…"
      />
      <FilterSelect label="CATEGORY" value={categoryFilter} onChange={onCategoryChange}>
        <option value="all">All Categories</option>
        {Object.entries(ISSUE_LABELS).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
        <option value="uncategorized">Uncategorized</option>
      </FilterSelect>
      <FilterSelect label="PRIORITY" value={priorityFilter} onChange={onPriorityChange}>
        <option value="all">All Priorities</option>
        {priorityLevels.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="JOB ORDER STATUS" value={statusFilter} onChange={onStatusChange}>
        <option value="all">All Statuses</option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
        <option value="cancelled">{statusLabel('cancelled')}</option>
        <option value="overdue">Overdue (response time exceeded)</option>
      </FilterSelect>
      <FilterSelect label="MUNICIPALITY" value={municipalityFilter} onChange={onMunicipalityChange}>
        <option value="all">All Municipalities</option>
        {municipalityOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="ASSIGNEE" value={assigneeFilter} onChange={onAssigneeChange}>
        <option value="all">All Linemen</option>
        <option value="unassigned">Unassigned</option>
        {assigneeOptions.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </FilterSelect>
      {hasActiveFilters && (
        <button onClick={onClear} className="text-sm text-blue-700 font-medium whitespace-nowrap">
          Clear filters
        </button>
      )}
      <a
        href="/supervisor/dispatch/create-master-ticket"
        className={buttonClasses({ dim: false, className: 'inline-block ml-auto' })}
      >
        + Create Master Ticket
      </a>
    </FilterBar>
  )
}