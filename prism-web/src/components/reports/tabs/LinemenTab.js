import ReportSection from '@/components/reports/ReportSection'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import { formatMinutes } from '@/lib/performance'
import { formatDuration } from '@/lib/stageTimes'
import { LINEMAN_COLUMNS } from '@/lib/reports/constants'

export default function LinemenTab({ linemen, pagination }) {
  return (
    <ReportSection
      title="Lineman Performance"
      description="Resolved jobs on the reports above. Read each average together with its rating count."
    >
      <DataTable
        columns={LINEMAN_COLUMNS}
        isEmpty={linemen.length === 0}
        empty="No lineman accounts yet."
        footer={<Pagination {...pagination.paginationProps} />}
      >
        {pagination.pageItems.map((l) => (
          <tr key={l.id} className="border-b border-gray-100 last:border-0">
            <td className="px-5 py-4 text-center font-medium text-gray-900">
              {l.name}
              {!l.isActive && (
                <span className="ml-2 text-xs font-semibold text-gray-400">Inactive</span>
              )}
            </td>
            <td className="px-5 py-4 text-center text-gray-600">{l.areaOffice || '—'}</td>
            <td className="px-5 py-4 text-center text-gray-600">{l.jobsCompleted}</td>
            <td className="px-5 py-4 text-center text-gray-600">{formatMinutes(l.avgRepair)}</td>
            <td className="px-5 py-4 text-center text-gray-600">{formatDuration(l.avgTravel)}</td>
            <td className="px-5 py-4 text-center text-gray-600">{formatDuration(l.avgOnSite)}</td>
            <td className="px-5 py-4 text-center">
              {l.ratingCount > 0 ? (
                <span className="font-semibold text-gray-900">
                  <span className="text-amber-500">★</span> {l.ratingAverage.toFixed(1)}
                </span>
              ) : (
                <span className="text-xs text-gray-400">No ratings</span>
              )}
            </td>
            <td className="px-5 py-4 text-center text-gray-600">{l.ratingCount}</td>
          </tr>
        ))}
      </DataTable>
    </ReportSection>
  )
}