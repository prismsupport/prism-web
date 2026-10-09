'use client'

import PhotoDropdown from '@/components/dispatch/PhotoDropdown'
import ReporterInfo from '@/components/dispatch/ReporterInfo'

export default function MatchReviewCard({
  title,
  ticketLabel,
  barangay,
  municipality,
  zone,
  nearestLandmark,
  description,
  photoUrl,
  otherHomesAffected,
  meta,
  isMaster,
  reportCount,
  reportId,
  consumerId,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-bold text-gray-500 uppercase mb-1">{title}</p>
      <p className="text-sm font-semibold text-gray-900 mb-2">{ticketLabel}</p>

      {meta && <p className="text-xs text-gray-500 mb-2">{meta}</p>}

      {isMaster && (
        <p className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded inline-block mb-2">
          MASTER TICKET · {reportCount} linked report{reportCount === 1 ? '' : 's'}
        </p>
      )}

      {!isMaster && reportId && consumerId && (
        <ReporterInfo reportId={reportId} consumerId={consumerId} />
      )}

      <div className="space-y-2 text-sm">
        <div>
          <p className="text-xs text-gray-400">Location</p>
          <p className="text-gray-900">{nearestLandmark || `${barangay}, ${municipality}`}</p>
          <p className="text-gray-500 text-xs">
            {zone && `Zone ${zone}, `}
            {barangay}, {municipality}
          </p>
        </div>

        {description && (
          <div>
            <p className="text-xs text-gray-400">Description</p>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-2 mt-1">"{description}"</p>
          </div>
        )}

        {!isMaster && <PhotoDropdown label="Photo Evidence" photoUrl={photoUrl} />}

        {otherHomesAffected && (
          <p className="text-xs text-amber-600 font-medium">
            ⚠ Consumer indicated nearby households are also affected
          </p>
        )}
      </div>
    </div>
  )
}