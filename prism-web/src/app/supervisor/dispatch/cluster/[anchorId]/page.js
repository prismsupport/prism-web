'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import SuggestionConfidenceBanner from '@/components/dispatch/SuggestionConfidenceBanner'
import ClusterMemberList from '@/components/dispatch/ClusterMemberList'
import MasterTicketSuccessCard from '@/components/dispatch/MasterTicketSuccessCard'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'
import { aggregateBreakdowns } from '@/lib/scoring/masterTicketScoringConfig'
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from '@/lib/toast'

function generateMasterTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `MT-${date}-${random}`
}

export default function ClusterReviewPage() {
  const { anchorId } = useParams()
  const router = useRouter()

  const [cluster, setCluster] = useState(null)
  const [anchorReport, setAnchorReport] = useState(null)
  const [members, setMembers] = useState([])
  const [clusterBreakdown, setClusterBreakdown] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    loadCluster()
  }, [anchorId])

  async function loadCluster() {
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

    if (!myRow) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    const { data: clusterData, error: clusterError } = await supabase.rpc(
      'get_duplicate_clusters',
      { p_cooperative_id: myRow.cooperative_id }
    )

    if (clusterError) {
      setError(clusterError.message)
      setLoading(false)
      return
    }

    const match = (clusterData || []).find((c) => c.cluster_anchor_id === anchorId)

    if (!match) {
      setError('This duplicate suggestion no longer exists — it may have already been resolved.')
      setLoading(false)
      return
    }

    setCluster(match)

    const { data: allReports, error: reportsError } = await supabase.rpc(
      'get_reports_with_location',
      { p_report_ids: match.report_ids }
    )

    if (reportsError) {
      setError(reportsError.message)
      setLoading(false)
      return
    }

    const anchor = (allReports || []).find((r) => r.report_id === anchorId)
    setAnchorReport(anchor)

    const consumerIds = (allReports || []).map((r) => r.consumer_id)
    let consumerNames = []
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', consumerIds)
      consumerNames = data || []
    }

    const merged = (allReports || [])
      .map((r) => ({
        ...r,
        reporterName: consumerNames.find((c) => c.id === r.consumer_id),
        isAnchor: r.report_id === anchorId,
        checked: true,
      }))
      .sort((a, b) => (b.isAnchor ? 1 : 0) - (a.isAnchor ? 1 : 0))

    const mergedWithPhotos = await Promise.all(
      merged.map(async (m) => {
        if (!m.photo_url) return m
        const { data: signed } = await supabase.storage
          .from('report-photos')
          .createSignedUrl(m.photo_url, 3600)
        return { ...m, photo_url: signed?.signedUrl || null }
      })
    )

    const withBreakdown = await Promise.all(
      mergedWithPhotos.map(async (m) => {
        if (m.isAnchor) return m
        const { data: breakdownData } = await supabase
          .rpc('get_match_breakdown', { p_report_id_a: anchorId, p_report_id_b: m.report_id })
          .single()
        return { ...m, breakdown: breakdownData }
      })
    )

    setMembers(withBreakdown)
    setClusterBreakdown(
      aggregateBreakdowns(withBreakdown.filter((m) => !m.isAnchor).map((m) => m.breakdown))
    )
    setLoading(false)
  }

  function handleToggleChecked(reportId) {
    setMembers((prev) =>
      prev.map((m) => (m.report_id === reportId ? { ...m, checked: !m.checked } : m))
    )
  }

  async function handleConfirmMerge() {
    const checkedMembers = members.filter((m) => m.isAnchor || m.checked)
    if (checkedMembers.length < 2) {
      setError('Select at least one report besides the anchor to merge.')
      return
    }

    setActionLoading(true)
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

    const masterTicketNumber = generateMasterTicketNumber()
    const checkedIds = checkedMembers.map((m) => m.report_id)

    const { data: newMaster, error: masterError } = await supabase
      .from('master_tickets')
      .insert({
        master_ticket: masterTicketNumber,
        cooperative_id: myRow.cooperative_id,
        barangay: anchorReport.barangay,
        municipality: anchorReport.municipality,
        location: `POINT(${anchorReport.lng} ${anchorReport.lat})`,
        priority: anchorReport.priority,
        report_count: checkedIds.length,
        status: 'pending',
      })
      .select()
      .single()

    if (masterError) {
      toast.error(masterError.message)
      setError(masterError.message)
      setActionLoading(false)
      return
    }

    const { error: linkError } = await supabase
      .from('reports')
      .update({ master_id: newMaster.master_id })
      .in('report_id', checkedIds)

    if (linkError) {
      toast.error(linkError.message)
      setError(linkError.message)
      setActionLoading(false)
      return
    }

    setActionLoading(false)
    setSuccessData({
      masterId: newMaster.master_id,
      masterTicketNumber,
      areaLabel: cluster.area_label,
      reportCount: checkedIds.length,
    })
    toast.success('Master ticket created')
  }

  function handleReject() {
    router.push('/supervisor/dispatch')
  }

  if (loading) return <PageLoading />

  if (successData) {
    return (
      <MasterTicketSuccessCard
        masterTicketNumber={successData.masterTicketNumber}
        areaLabel={successData.areaLabel}
        reportCount={successData.reportCount}
        onAssignLineman={() => router.push(`/supervisor/dispatch/master/${successData.masterId}`)}
      />
    )
  }

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

  const checkedCount = members.filter((m) => !m.isAnchor && m.checked).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <ReportMap
          markers={members.map((m) => ({
            lat: m.lat,
            lng: m.lng,
            label: `${m.reporterName?.first_name || ''} ${m.reporterName?.last_name || ''} — ${m.ticket_number}`,
          }))}
        />
      </div>

      <div className="overflow-y-auto space-y-6">
        <SuggestionConfidenceBanner
          title="Smart Master Ticket Suggestion"
          confidence={cluster.confidence}
          subtitlePrefix={`${cluster.area_label} • Overall `}
          theme="blue"
          description="The system recommends grouping these reports into one Master Ticket. Uncheck any report below that doesn't actually belong before confirming."
          breakdown={clusterBreakdown}
        />

        <ClusterMemberList
          members={members}
          expandedId={expandedId}
          onToggleExpand={setExpandedId}
          onToggleChecked={handleToggleChecked}
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
            Not a Duplicate
          </button>
          <button
            onClick={handleConfirmMerge}
            disabled={actionLoading || checkedCount === 0}
            className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            {actionLoading ? 'Merging…' : `Merge ${checkedCount + 1} Selected`}
          </button>
        </div>
      </div>
    </div>
  )
}