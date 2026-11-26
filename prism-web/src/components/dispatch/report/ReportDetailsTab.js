import { issueLabel } from '@/lib/issueCodes'
import { RECURRING_MIN_REPORTS, RECURRING_WINDOW_DAYS } from '@/lib/recurring'
import TicketDetailHeader from '@/components/dispatch/TicketDetailHeader'
import TicketStatusPriority from '@/components/dispatch/TicketStatusPriority'
import ReporterInfo from '@/components/dispatch/ReporterInfo'
import PhotoDropdown from '@/components/dispatch/PhotoDropdown'
import VideoDropdown from '@/components/dispatch/VideoDropdown'
import ProofLocationBadge from '@/components/dispatch/ProofLocationBadge'

const COMPACT_SCROLL = 'lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto'

function formatLong(value) {
  return new Date(value).toLocaleString('en-PH', {
    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// "Details" tab of the report review page. Display only: the page owns the data.
export default function ReportDetailsTab({
  report,
  reporterName,
  assignment,
  currentStatus,
  issueCode,
  proofLocation,
  videoPath,
  photoSignedUrl,
  recurringCount,
  showMap,
  onShowMap,
  compactLayout,
}) {
  return (
    <div className="space-y-4">
      <div className={`relative bg-white rounded-xl border border-gray-200 p-6 ${compactLayout ? COMPACT_SCROLL : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <TicketDetailHeader
            ticketNumber={report.ticket_number}
            reporterName={reporterName}
            reopened={!!report.reopened_at}
          />
          {!showMap && (
            <button
              type="button"
              onClick={onShowMap}
              className="mr-8 text-sm text-blue-700 font-medium border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 whitespace-nowrap"
            >
              View Map
            </button>
          )}
        </div>

        <TicketStatusPriority status={currentStatus} priority={report.priority} />

        <ReporterInfo reportId={report.report_id} consumerId={report.consumer_id} />

        <div className={compactLayout ? 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm' : 'space-y-3 text-sm'}>
          <div>
            <p className="text-xs text-gray-400">Time Reported</p>
            <p className="text-gray-900">{formatLong(report.created_at)}</p>
          </div>
          {assignment?.completed_at && (
            <div>
              <p className="text-xs text-gray-400">Time Restored</p>
              <p className="text-gray-900">{formatLong(assignment.completed_at)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Location</p>
            <p className="text-gray-900 font-medium">
              {report.nearest_landmark || `${report.barangay}, ${report.municipality}`}
            </p>
            <p className="text-gray-500 text-xs">
              Zone {report.zone || '—'}, {report.barangay}, {report.municipality}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Category</p>
            <p className="text-gray-900 font-medium">{issueLabel(issueCode)}</p>
            {recurringCount >= RECURRING_MIN_REPORTS && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">
                ↻ Recurring: {recurringCount} reports of this type in {report.barangay} in the last {RECURRING_WINDOW_DAYS} days
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Evidence location</p>
            <ProofLocationBadge value={proofLocation} />
          </div>
          <div className={compactLayout ? 'md:col-span-2' : ''}>
            <p className="text-xs text-gray-400">Description</p>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mt-1">
              "{report.report_details}"
            </p>
          </div>
          {report.other_homes_affected && (
            <p className="text-xs text-amber-600 font-medium">
              ⚠ Consumer indicated nearby households are also affected
            </p>
          )}
          <PhotoDropdown label="Photo Evidence" photoUrl={photoSignedUrl} />
          <VideoDropdown label="Video Evidence" bucket="report-photos" path={videoPath} />
        </div>
      </div>

      {report.status === 'cancelled' && (
        <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${compactLayout ? COMPACT_SCROLL : ''}`}>
          <h2 className="text-sm font-bold text-red-700 mb-2">Report Declined</h2>
          <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-red-100">
            {report.decline_reason || 'No reason provided.'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Declined: {formatLong(report.updated_at)}
          </p>
        </div>
      )}
    </div>
  )
}