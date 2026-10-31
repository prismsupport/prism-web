import { TableSkeletonRows } from '@/components/ui/Skeleton'

const MESSAGE_CELL = 'px-5 py-8 text-center text-gray-500'

export default function DataTable({
  columns,
  loading = false,
  skeletonRows,
  loadingRow,
  isEmpty = false,
  empty,
  footer,
  className = '',
  children,
}) {
  const colCount = columns.length

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
            {columns.map((c, i) => {
              const col = typeof c === 'string' ? { label: c } : c
              return (
                <th key={i} className={`px-5 py-3 font-semibold ${col.className || ''}`}>
                  {col.label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading &&
            (skeletonRows ? (
              <TableSkeletonRows rows={skeletonRows} cols={colCount} />
            ) : loadingRow !== undefined ? (
              loadingRow
            ) : (
              <tr>
                <td colSpan={colCount} className={MESSAGE_CELL}>
                  Loading…
                </td>
              </tr>
            ))}
          {!loading && isEmpty && (
            <tr>
              <td colSpan={colCount} className={typeof empty === 'string' ? MESSAGE_CELL : undefined}>
                {empty}
              </td>
            </tr>
          )}
          {!loading && !isEmpty && children}
        </tbody>
      </table>
      {footer}
    </div>
  )
}
