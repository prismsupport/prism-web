import SegmentedControl from '@/components/ui/SegmentedControl'
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterMenu, FilterChips } from '@/components/ui/FilterMenu'
import { RANGES } from '@/lib/reports/constants'

const DATE_INPUT =
  'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600'

export default function ReportFilterBar({
  rangeKey,
  onRangeChange,
  refreshing,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  compare,
  onCompareChange,
  filters,
}) {
  return (
    <div className="-mx-1 bg-gray-50 px-1 pt-1">
      <FilterBar className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl options={RANGES} value={rangeKey} onChange={onRangeChange} disabled={refreshing} />

        {rangeKey === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Start date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className={DATE_INPUT}
            />
            <span className="text-sm text-gray-400">to</span>
            <input
              type="date"
              aria-label="End date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => onCustomToChange(e.target.value)}
              className={DATE_INPUT}
            />
          </div>
        )}

        <label
          className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"
          title={rangeKey === 'all' ? 'Not available for All time' : undefined}
        >
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={compare && rangeKey !== 'all'}
            disabled={refreshing || rangeKey === 'all'}
            onChange={(e) => onCompareChange(e.target.checked)}
          />
          Compare with previous period
        </label>

        <div className="ml-auto">
          <FilterMenu filters={filters} label="Filters" />
        </div>
        <FilterChips filters={filters} />
      </FilterBar>
    </div>
  )
}