export default function Pagination({ page, totalPages, totalCount, pageSize, onPageChange }) {
  if (totalCount === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
      <p className="text-xs text-gray-500">
        Showing {from}–{to} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 disabled:opacity-40 hover:bg-white"
        >
          Previous
        </button>
        <span className="text-xs text-gray-500">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 disabled:opacity-40 hover:bg-white"
        >
          Next
        </button>
      </div>
    </div>
  )
}