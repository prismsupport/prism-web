import { FilterBar, FilterSelect } from '@/components/ui/FilterBar'
import { buttonClasses } from '@/components/ui/Button'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'

export default function DispatchFilters({
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
  statusOptions,
}) {
  const { statusLabel, priorityLevels } = useStatusLabels()
  return (
    <FilterBar>
      <div className="flex items-center gap-6">
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
        </FilterSelect>
      </div>
      <a
        href="/supervisor/dispatch/create-master-ticket"
        className={buttonClasses({ dim: false, className: 'inline-block' })}
      >
        + Create Master Ticket
      </a>
    </FilterBar>
  )
}
