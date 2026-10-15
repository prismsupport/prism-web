'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import SuggestionConfidenceBanner from '@/components/dispatch/SuggestionConfidenceBanner'
import MatchReviewCard from '@/components/dispatch/MatchReviewCard'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'
import { PageLoading } from "@/components/ui/Skeleton";

function generateMasterTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `MT-${date}-${random}`
}

export default function JoinReviewPage() {
  const { reportId } = useParams()
  const router = useRouter()

  const [report, setReport] = useState(null)
  const [reportPhotoUrl, setReportPhotoUrl] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [cooperativeId, setCooperativeId] = useState(null)
  const [targetLat, setTargetLat] = useState(null)
  const [targetLng, setTargetLng] = useState(null)
  const [targetStatus, setTargetStatus] = useState(null)
  const [targetDetails, setTargetDetails] = useState(null)
  const [targetPhotoUrl, setTargetPhotoUrl] = useState(null)
  const [breakdown, setBreakdown] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [reportId])

  async function loadData() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: myRow } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()

    setCooperativeId(myRow?.cooperative_id)

    const { data: reportData, error: reportError } = await supabase
      .rpc('get_report_with_location', { p_report_id: reportId })
      .single()

    if (reportError) {
      setError(reportError.message)
      setLoading(false)
      return
    }
    setReport(reportData)

    if (reportData.photo_url) {
      const { data: signed } = await supabase.storage
        .from('report-photos')
        .createSignedUrl(reportData.photo_url, 3600)
      if (signed) setReportPhotoUrl(signed.signedUrl)
    }

    const { data: suggestionData, error: suggestionError } = await supabase
      .rpc('get_join_suggestion_for_report', { p_report_id: reportId })
      .maybeSingle()

    if (suggestionError || !suggestionData) {
      setError('This suggestion no longer exists — it may have already been resolved.')
      setLoading(false)
      return
    }
    setSuggestion(suggestionData)

    const breakdownRpc =
      suggestionData.target_type === 'master'
        ? supabase.rpc('get_match_breakdown_against_master', {
            p_report_id: reportId,
            p_master_id: suggestionData.target_id,
          })
        : supabase.rpc('get_match_breakdown', {
            p_report_id_a: reportId,
            p_report_id_b: suggestionData.target_id,
          })

    const { data: breakdownData } = await breakdownRpc.single()
    setBreakdown(breakdownData)

    if (suggestionData.target_type === 'master') {
      const { data: geo } = await supabase
        .rpc('get_master_ticket_with_location', { p_master_id: suggestionData.target_id })
        .single()
      setTargetLat(geo?.lat)
      setTargetLng(geo?.lng)

      const { data: masterRow } = await supabase
        .from('master_tickets')
        .select('*')
        .eq('master_id', suggestionData.target_id)
        .single()
      setTargetStatus(masterRow?.status)
      setTargetDetails(masterRow)
    } else {
      const { data: geo } = await supabase
        .rpc('get_report_with_location', { p_report_id: suggestionData.target_id })
        .single()
      setTargetLat(geo?.lat)
      setTargetLng(geo?.lng)
      setTargetStatus(geo?.status)
      setTargetDetails(geo)

      if (geo?.photo_url) {
        const { data: signed } = await supabase.storage
          .from('report-photos')
          .createSignedUrl(geo.photo_url, 3600)
        if (signed) setTargetPhotoUrl(signed.signedUrl)
      }
    }

    setLoading(false)
  }

  async function handleConfirmJoin() {
    setActionLoading(true)
    setError('')
    const supabase = createClient()

    if (suggestion.target_type === 'master') {
      const { error: updateError } = await supabase
        .from('reports')
        .update({ master_id: suggestion.target_id, status: targetStatus })
        .eq('report_id', reportId)

      if (updateError) {
        setError(updateError.message)
        setActionLoading(false)
        return
      }

      const { data: masterRow } = await supabase
        .from('master_tickets')
        .select('report_count')
        .eq('master_id', suggestion.target_id)
        .single()

      await supabase
        .from('master_tickets')
        .update({ report_count: (masterRow?.report_count || 1) + 1 })
        .eq('master_id', suggestion.target_id)
    } else {
      const { data: newMaster, error: masterError } = await supabase
        .from('master_tickets')
        .insert({
          master_ticket: generateMasterTicketNumber(),
          cooperative_id: cooperativeId,
          barangay: report.barangay,
          municipality: report.municipality,
          location: `POINT(${targetLng} ${targetLat})`,
          priority: report.priority,
          report_count: 2,
          status: targetStatus,
        })
        .select()
        .single()

      if (masterError) {
        setError(masterError.message)
        setActionLoading(false)
        return
      }

      const { error: linkError } = await supabase
        .from('reports')
        .update({ master_id: newMaster.master_id, status: targetStatus })
        .in('report_id', [reportId, suggestion.target_id])

      if (linkError) {
        setError(linkError.message)
        setActionLoading(false)
        return
      }

      await supabase
        .from('job_assignments')
        .update({ master_id: newMaster.master_id })
        .eq('report_id', suggestion.target_id)
    }

    router.push('/supervisor/dispatch')
  }

  function handleReject() {
    router.push('/supervisor/dispatch')
  }

  if (loading) return <PageLoading />

  if (error) {
    return (
      <div>
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
        <BackToDispatchLink />
      </div>
    )
  }

  const isTargetMaster = suggestion.target_type === 'master'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <ReportMap
          markers={[
            { lat: report.lat, lng: report.lng, label: `New: ${report.ticket_number}` },
            { lat: targetLat, lng: targetLng, label: `Existing: ${suggestion.target_label}` },
          ]}
        />
      </div>

      <div className="overflow-y-auto space-y-6">
        <SuggestionConfidenceBanner
          title="Possible Match"
          confidence={suggestion.score}
          theme="purple"
          breakdown={breakdown}
          description={
            <>
              The system suggests {report.ticket_number} may be the same outage as{' '}
              {suggestion.target_label}, which is already{' '}
              {isTargetMaster ? 'a Master Ticket' : 'being worked on'}.
            </>
          }
        />

        <MatchReviewCard
          title="New Report"
          ticketLabel={report.ticket_number}
          barangay={report.barangay}
          municipality={report.municipality}
          zone={report.zone}
          nearestLandmark={report.nearest_landmark}
          description={report.report_details}
          photoUrl={reportPhotoUrl}
          otherHomesAffected={report.other_homes_affected}
        />

        <MatchReviewCard
          title={isTargetMaster ? 'Existing Master Ticket' : 'Existing Report'}
          ticketLabel={suggestion.target_label}
          barangay={targetDetails?.barangay}
          municipality={targetDetails?.municipality}
          zone={targetDetails?.zone}
          nearestLandmark={targetDetails?.nearest_landmark}
          description={!isTargetMaster ? targetDetails?.report_details : null}
          photoUrl={targetPhotoUrl}
          otherHomesAffected={!isTargetMaster && targetDetails?.other_homes_affected}
          meta={`Current status: ${targetStatus}`}
          isMaster={isTargetMaster}
          reportCount={targetDetails?.report_count}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            Not a Match
          </button>
          <button
            onClick={handleConfirmJoin}
            disabled={actionLoading}
            className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            {actionLoading ? 'Joining…' : 'Confirm & Join'}
          </button>
        </div>
      </div>
    </div>
  )
}