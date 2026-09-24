'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import SuggestionConfidenceBanner from '@/components/dispatch/SuggestionConfidenceBanner'
import TicketSummaryCard from '@/components/dispatch/TicketSummaryCard'

function generateMasterTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `MT-${date}-${random}`
}

export default function JoinReviewPage() {
  const { reportId } = useParams()
  const router = useRouter()

  const [report, setReport] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [cooperativeId, setCooperativeId] = useState(null)
  const [targetLat, setTargetLat] = useState(null)
  const [targetLng, setTargetLng] = useState(null)
  const [targetStatus, setTargetStatus] = useState(null)
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

    const { data: suggestionData, error: suggestionError } = await supabase
      .rpc('get_join_suggestion_for_report', { p_report_id: reportId })
      .maybeSingle()

    if (suggestionError || !suggestionData) {
      setError('This suggestion no longer exists — it may have already been resolved.')
      setLoading(false)
      return
    }
    setSuggestion(suggestionData)

    if (suggestionData.target_type === 'master') {
      const { data: geo } = await supabase
        .rpc('get_master_ticket_with_location', { p_master_id: suggestionData.target_id })
        .single()
      setTargetLat(geo?.lat)
      setTargetLng(geo?.lng)

      const { data: masterRow } = await supabase
        .from('master_tickets')
        .select('status')
        .eq('master_id', suggestionData.target_id)
        .single()
      setTargetStatus(masterRow?.status)
    } else {
      const { data: geo } = await supabase
        .rpc('get_report_with_location', { p_report_id: suggestionData.target_id })
        .single()
      setTargetLat(geo?.lat)
      setTargetLng(geo?.lng)
      setTargetStatus(geo?.status)
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

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  if (error) {
    return (
      <div>
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
        <button
          onClick={() => router.push('/supervisor/dispatch')}
          className="text-sm text-blue-700 font-medium"
        >
          ← Back to Dispatch
        </button>
      </div>
    )
  }

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
          description={
            <>
              The system suggests {report.ticket_number} may be the same outage as{' '}
              {suggestion.target_label}, which is already{' '}
              {suggestion.target_type === 'master' ? 'a Master Ticket' : 'being worked on'}.
            </>
          }
        />

        <TicketSummaryCard
          title="New Report"
          ticketLabel={report.ticket_number}
          location={report.nearest_landmark || `${report.barangay}, ${report.municipality}`}
          description={report.report_details}
        />

        <TicketSummaryCard
          title={`Existing ${suggestion.target_type === 'master' ? 'Master Ticket' : 'Report'}`}
          ticketLabel={suggestion.target_label}
          meta={`Current status: ${targetStatus}`}
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