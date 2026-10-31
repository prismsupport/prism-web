'use client'

import { useState } from 'react'

export const PAGE_SIZE = 10

export default function usePagination(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)

  return {
    page,
    setPage,
    totalPages,
    pageItems,
    paginationProps: {
      page,
      totalPages,
      totalCount: items.length,
      pageSize,
      onPageChange: setPage,
    },
  }
}
