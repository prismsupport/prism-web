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

// Simple straight-line distance between two coordinates, in meters.
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function ClusterReviewPage() {
  const { anchorId } = useParams()
  const router = useRouter()

  const [cluster, setCluster] = useState(null)
  const [anchorReport, setAnchorReport] = useState(null)
  const [members, setMembers] = useState([])
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

    // One batch call for every report in the cluster, with real coordinates
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
      .map((r) => {
        const isAnchor = r.report_id === anchorId
        const distance =
          !isAnchor && anchor
            ? distanceMeters(anchor.lat, anchor.lng, r.lat, r.lng)
            : 0
        const minutesApart = !isAnchor && anchor
          ? Math.abs(new Date(r.created_at) - new Date(anchor.created_at)) / 60000
          : 0
        return {
          ...r,
          reporterName: consumerNames.find((c) => c.id === r.consumer_id),
          isAnchor,
          distance,
          minutesApart,
        }
      })
      .sort((a, b) => (b.isAnchor ? 1 : 0) - (a.isAnchor ? 1 : 0) || a.distance - b.distance)

    setMembers(merged)
    setLoading(false)
  }

  async function handleConfirmMerge() {
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

    const { data: newMaster, error: masterError } = await supabase
      .from('master_tickets')
      .insert({
        master_ticket: masterTicketNumber,
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

    setActionLoading(false)
    setSuccessData({
      masterId: newMaster.master_id,
      masterTicketNumber,
      areaLabel: cluster.area_label,
      reportCount: members.length,
    })
  }

  function handleReject() {
    router.push('/supervisor/dispatch')
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  if (successData) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Master Ticket Created Successfully
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Master Ticket{' '}
            <span className="font-semibold text-gray-700">
              #{successData.masterTicketNumber}
            </span>{' '}
            has been successfully created. All {successData.reportCount} individual
            reports have been linked.
          </p>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-3 gap-2 text-left mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">
                Master Ticket ID
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {successData.masterTicketNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Location</p>
              <p className="text-sm font-semibold text-gray-900">
                {successData.areaLabel}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">
                Linked Reports
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {successData.reportCount} Reports
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-0 bg-white rounded-b-xl border-x border-b border-gray-200 p-6">
          <button
            onClick={() =>
              router.push(`/supervisor/dispatch/master/${successData.masterId}`)
            }
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            Assign Lineman
          </button>
        </div>
      </div>
    )
  }

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
          markers={members.map((m) => ({
            lat: m.lat,
            lng: m.lng,
            label: `${m.reporterName?.first_name || ''} ${m.reporterName?.last_name || ''} — ${m.ticket_number}`,
          }))}
        />
      </div>

      <div className="overflow-y-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            Potential Duplicate Cluster
          </h1>
          <p className="text-sm text-gray-500">
            {cluster.area_label} • Overall Confidence:{' '}
            <span className="font-semibold text-green-600">{cluster.confidence}%</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">
              Reports in this Cluster
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
              TOTAL: {members.length}
            </span>
          </div>

          <div className="space-y-2">
            {members.map((m) => {
              const isExpanded = expandedId === m.report_id
              return (
                <div key={m.report_id} className="border border-gray-200 rounded-lg">
                  <div className="w-full flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {m.reporterName?.first_name} {m.reporterName?.last_name}
                        {m.isAnchor && (
                          <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            ANCHOR
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{m.ticket_number}</p>
                      {!m.isAnchor && (
                        <>
                          <p className="text-xs text-gray-400">
                            {Math.round(m.distance)}m from anchor
                          </p>
                          <p className="text-xs text-gray-400">
                            {Math.round(m.minutesApart)} min apart
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : m.report_id)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {isExpanded ? 'Hide' : 'Review'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-3 text-sm space-y-2">
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-gray-900">
                          {m.nearest_landmark || `${m.barangay}, ${m.municipality}`}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Zone {m.zone || '—'}, {m.barangay}, {m.municipality}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Description</p>
                        <p className="text-gray-700 bg-gray-50 rounded-lg p-2 mt-1">
                          "{m.report_details}"
                        </p>
                      </div>
                      {m.photo_url ? (
                        <img
                          src={m.photo_url}
                          alt="Report evidence"
                          className="w-full rounded-lg border border-gray-200"
                        />
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No photo submitted.
                        </p>
                      )}
                      {m.other_homes_affected && (
                        <p className="text-xs text-amber-600 font-medium">
                          ⚠ Nearby households also affected
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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