'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { issueLabel } from '@/lib/issueCodes'
import PhotoDropdown from '@/components/dispatch/PhotoDropdown'
import VideoDropdown from '@/components/dispatch/VideoDropdown'
import ProofLocationBadge from '@/components/dispatch/ProofLocationBadge'
import ReporterInfo from '@/components/dispatch/ReporterInfo'

// Category, evidence location and video are loaded here from reportId, so the
// pages that use this card (cluster, join, create master, master ticket) do not
// need to pass them. Pass reportId for a single report; leave it out for a Master Ticket.
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
  const [extra, setExtra] = useState(null)

  useEffect(() => {
    if (isMaster || !reportId) return
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('reports')
        .select('issue_code, proof_location_consistent, video_url')
        .eq('report_id', reportId)
        .maybeSingle()
      if (!cancelled) setExtra(data || null)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [reportId, isMaster])

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

        {!isMaster && reportId && extra && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {issueLabel(extra.issue_code)}
            </span>
            <ProofLocationBadge value={extra.proof_location_consistent} />
          </div>
        )}

        {description && (
          <div>
            <p className="text-xs text-gray-400">Description</p>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-2 mt-1">"{description}"</p>
          </div>
        )}

        {!isMaster && <PhotoDropdown label="Photo Evidence" photoUrl={photoUrl} />}

        {!isMaster && reportId && extra?.video_url && (
          <VideoDropdown label="Video Evidence" bucket="report-photos" path={extra.video_url} />
        )}

        {otherHomesAffected && (
          <p className="text-xs text-amber-600 font-medium">
            ⚠ Consumer indicated nearby households are also affected
          </p>
        )}
      </div>
    </div>
  )
}