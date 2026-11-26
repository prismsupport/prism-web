import Button from '@/components/ui/Button'
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterMenu, FilterChips } from '@/components/ui/FilterMenu'
import SearchInput from '@/components/ui/SearchInput'
import ArchiveIcon from '@/components/ui/icons/ArchiveIcon'

// Search, filters, archive toggle, Manage Area Offices and Add buttons of the Service Areas page.
export default function ServiceAreaToolbar({
  searchText,
  onSearchChange,
  filters,
  showArchived,
  onToggleArchived,
  onManageAreaOffices,
  onAdd,
}) {
  return (
    <FilterBar className="flex flex-wrap items-center gap-3">
      <SearchInput
        className="flex-1 min-w-[200px]"
        value={searchText}
        onChange={onSearchChange}
        placeholder="Search barangay, municipality, substation, feeder, area office…"
      />
      <FilterMenu filters={filters} />
      <Button
        variant="plain"
        dim={false}
        className="inline-flex items-center gap-2 whitespace-nowrap"
        onClick={onToggleArchived}
      >
        <ArchiveIcon />
        {showArchived ? 'Back to Service Areas' : 'View Archive'}
      </Button>
      <Button
        variant="plain"
        dim={false}
        className="inline-flex items-center gap-2 whitespace-nowrap"
        onClick={onManageAreaOffices}
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
          <path d="M3 21h18" />
          <path d="M5 21V5l7-3 7 3v16" />
          <path d="M9 9h1" />
          <path d="M14 9h1" />
          <path d="M9 13h1" />
          <path d="M14 13h1" />
          <path d="M9 21v-4h6v4" />
        </svg>
        Manage Area Offices
      </Button>
      {!showArchived && (
        <Button dim={false} className="whitespace-nowrap" onClick={onAdd}>
          + Add Service Area
        </Button>
      )}
      <FilterChips filters={filters} />
    </FilterBar>
  )
}