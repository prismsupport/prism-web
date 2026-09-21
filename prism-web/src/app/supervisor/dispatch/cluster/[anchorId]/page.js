'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

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

    // Recompute clusters fresh, then find the one matching this anchor.
    // Nothing is persisted for a suggestion until it's actually confirmed,
    // so this is the reliable way to know which reports belong together.
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

    const { data: anchorData, error: anchorError } = await supabase
      .rpc('get_report_with_location', { p_report_id: anchorId })
      .single()

    if (anchorError) setError(anchorError.message)
    setAnchorReport(anchorData)

    const { data: memberReports, error: memberError } = await supabase
      .from('reports')
      .select('*')
      .in('report_id', match.report_ids)
      .order('created_at', { ascending: true })

    if (memberError) setError(memberError.message)

    const consumerIds = (memberReports || []).map((r) => r.consumer_id)
    let consumerNames = []
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', consumerIds)
      consumerNames = data || []
    }

    const merged = (memberReports || []).map((r) => ({
      ...r,
      reporterName: consumerNames.find((c) => c.id === r.consumer_id),
    }))

    setMembers(merged)
    setLoading(false)
  }

  async function handleConfirmMerge() {
    setActionLoading(true)
    setError('')
    const supabase = createClient()

    const { data: myRow } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', (await supabase.auth.getUser()).data.user.id)
      .single()

    // New master ticket, inheriting location/area from the anchor report
    const { data: newMaster, error: masterError } = await supabase
      .from('master_tickets')
      .insert({
        master_ticket: generateMasterTicketNumber(),
        cooperative_id: myRow.cooperative_id,
        barangay: anchorReport.barangay,
        municipality: anchorReport.municipality,
        location: `POINT(${anchorReport.lng} ${anchorReport.lat})`,
        priority: anchorReport.priority,
        report_count: members.length,
        status: 'pending',
      })
      .select()
      .single()

    if (masterError) {
      setError(masterError.message)
      setActionLoading(false)
      return
    }

    // Link every report in the cluster to this new master ticket
    const { error: linkError } = await supabase
      .from('reports')
      .update({ master_id: newMaster.master_id })
      .in(
        'report_id',
        members.map((m) => m.report_id)
      )

    if (linkError) {
      setError(linkError.message)
      setActionLoading(false)
      return
    }

    router.push('/supervisor/dispatch')
  }

  function handleReject() {
    // Nothing was ever created for a suggestion, so rejecting just means
    // leaving — the reports stay standalone and unlinked.
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
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[1000] bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg">
          ● ACTIVE INCIDENT
        </div>
        <ReportMap
          lat={anchorReport?.lat}
          lng={anchorReport?.lng}
          label={anchorReport?.nearest_landmark || anchorReport?.barangay}
        />
      </div>

      <div className="overflow-y-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            Potential Duplicate Cluster
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {cluster.area_label} • Confidence:{' '}
            <span className="font-semibold text-green-600">{cluster.confidence}%</span>
          </p>

          <div className="text-sm space-y-2">
            <div>
              <p className="text-xs text-gray-400">Location</p>
              <p className="text-gray-900 font-medium">
                {anchorReport?.nearest_landmark ||
                  `${anchorReport?.barangay}, ${anchorReport?.municipality}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Time Range</p>
              <p className="text-gray-900">
                {members.length > 0 &&
                  `${new Date(members[0].created_at).toLocaleTimeString('en-PH', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} – ${new Date(
                    members[members.length - 1].created_at
                  ).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Affected Consumers</h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
              TOTAL: {members.length}
            </span>
          </div>
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.report_id}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {m.reporterName?.first_name} {m.reporterName?.last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Zone {m.zone || '—'}, {m.barangay}, {m.municipality}
                  </p>
                </div>
                <span className="text-xs font-medium text-blue-700">
                  {m.ticket_number}
                </span>
              </div>
            ))}
          </div>
        </div>

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
            disabled={actionLoading}
            className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            {actionLoading ? 'Merging…' : 'Confirm Merge'}
          </button>
        </div>
      </div>
    </div>
  )
}