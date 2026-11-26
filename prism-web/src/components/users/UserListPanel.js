import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import SearchInput from '@/components/ui/SearchInput'
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar'
import { FilterMenu, FilterChips } from '@/components/ui/FilterMenu'

// filters: optional list for FilterMenu and FilterChips (Lineman and Consumer tabs)
// extraControls: optional extra controls shown after the sort (Supervisor access filter)
// action: optional button shown after the filter menu
export default function UserListPanel({
  title,
  description,
  searchPlaceholder,
  searchText,
  onSearchChange,
  sortValue,
  onSortChange,
  filters,
  extraControls,
  action,
  columns,
  loading,
  isEmpty,
  emptyText,
  paginationProps,
  children,
}) {
  return (
    <>
      <PageHeader title={title} description={description} />

      <FilterBar className="flex flex-wrap items-center gap-3">
        <SearchInput
          className="flex-1 min-w-[200px]"
          value={searchText}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        <FilterSelect label="SORT" value={sortValue} onChange={onSortChange}>
          <option value="Name (A-Z)">Name (A-Z)</option>
          <option value="Name (Z-A)">Name (Z-A)</option>
        </FilterSelect>
        {extraControls}
        {filters && <FilterMenu filters={filters} />}
        {action}
        {filters && <FilterChips filters={filters} />}
      </FilterBar>

      <DataTable
        columns={columns}
        loading={loading}
        isEmpty={isEmpty}
        empty={emptyText}
        footer={!loading && <Pagination {...paginationProps} />}
      >
        {children}
      </DataTable>
    </>
  )
}