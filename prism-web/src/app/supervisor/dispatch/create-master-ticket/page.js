'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { generateMasterTicketNumber } from '@/lib/dispatch/masterTicketNumber'
import { formatDateTime } from '@/lib/format'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'
import MatchReviewCard from '@/components/dispatch/MatchReviewCard'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import { getMatchTier, buildBreakdownFactors } from '@/lib/scoring/masterTicketScoringConfig'
import { toast } from '@/lib/toast'

const COLUMNS = [
  { label: '', className: 'w-12' },
  'Ticket ID',
  'Location',
  'Reported',
  'Match vs Anchor',
  '',
]

export default function CreateMasterTicketPage() {
  const router = useRouter()

  const [cooperativeId, setCooperativeId] = useState(null)
  const [reports, setReports] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [breakdowns, setBreakdowns] = useState({})
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const coopId = await getMyCooperativeId(supabase)

    if (!coopId) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    setCooperativeId(coopId)

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('cooperative_id', coopId)
      .is('master_id', null)
      .not('status', 'in', '(resolved,cancelled)')
      .order('created_at', { ascending: false })

    if (reportError) {
      setError(reportError.message)
      setLoading(false)
      return
    }

    const reportIds = (reportData || []).map((r) => r.report_id)
    let withLocation = []
    if (reportIds.length > 0) {
      const { data } = await supabase.rpc('get_reports_with_location', {
        p_report_ids: reportIds,
      })
      withLocation = data || []
    }

    const withSignedPhotos = await Promise.all(
      withLocation.map(async (r) => {
        if (!r.photo_url) return r
        const { data: signed } = await supabase.storage
          .from('report-photos')
          .createSignedUrl(r.photo_url, 3600)
        return { ...r, photo_url: signed?.signedUrl || null }
      })
    )

    setReports(withSignedPhotos)
    setLoading(false)
  }

  const anchorId = selectedIds[0] || null
  const anchorReport = reports.find((r) => r.report_id === anchorId) || null

  // Whenever the anchor changes, fetch each other report's match breakdown
  // against it, so the supervisor sees real data instead of guessing by eye.
  useEffect(() => {
    if (!anchorId) {
      setBreakdowns({})
      return
    }

    let cancelled = false
    async function loadBreakdowns() {
      setBreakdownLoading(true)
      const supabase = createClient()

      const results = await Promise.all(
        reports
          .filter((r) => r.report_id !== anchorId)
          .map(async (r) => {
            const { data } = await supabase
              .rpc('get_match_breakdown', { p_report_id_a: anchorId, p_report_id_b: r.report_id })
              .single()
            return [r.report_id, data]
          })
      )

      if (!cancelled) {
        setBreakdowns(Object.fromEntries(results))
        setBreakdownLoading(false)
      }
    }
    loadBreakdowns()

    return () => {
      cancelled = true
    }
  }, [anchorId, reports])

  function toggleReport(report) {
    setSelectedIds((prev) => {
      if (prev.includes(report.report_id)) {
        return prev.filter((id) => id !== report.report_id)
      }
      return [...prev, report.report_id]
    })
  }

  const sortedReports = [...reports].sort((a, b) => {
    if (a.report_id === anchorId) return -1
    if (b.report_id === anchorId) return 1
    const scoreA = breakdowns[a.report_id]?.total_score ?? -1
    const scoreB = breakdowns[b.report_id]?.total_score ?? -1
    return scoreB - scoreA
  })

  async function handleCreate() {
    if (selectedIds.length < 2) return

    setCreating(true)
    setError('')
    const supabase = createClient()

    const base = anchorReport

    const { data: newMaster, error: masterError } = await supabase
      .from('master_tickets')
      .insert({
        master_ticket: generateMasterTicketNumber(),
        cooperative_id: cooperativeId,
        barangay: base.barangay,
        municipality: base.municipality,
        location: `POINT(${base.lng} ${base.lat})`,
        priority: base.priority,
        report_count: selectedIds.length,
        status: 'pending',
      })
      .select()
      .single()

    if (masterError) {
      toast.error(masterError.message)
      setError(masterError.message)
      setCreating(false)
      return
    }

    const { error: linkError } = await supabase
      .from('reports')
      .update({ master_id: newMaster.master_id })
      .in('report_id', selectedIds)

    if (linkError) {
      toast.error(linkError.message)
      setError(linkError.message)
      setCreating(false)
      return
    }

    toast.success('Master ticket created')
    router.push(`/supervisor/dispatch/master/${newMaster.master_id}`)
  }

  return (
    <div>
      <BackToDispatchLink withMarginBottom />

      <h1 className="text-2xl font-bold text-gray-900">Create Master Ticket</h1>
      <p className="text-sm text-gray-500 mt-1 mb-1">
        Select the first report to use as your anchor — every other report will then show its
        match score and breakdown against it, so you can handpick which ones actually belong
        together instead of guessing by distance alone.
      </p>
      {!anchorId && (
        <p className="text-xs text-amber-600 font-medium mb-6">
          No anchor selected yet — pick any report below to see match scores.
        </p>
      )}
      {anchorId && <div className="mb-6" />}

      <Alert>{error}</Alert>

      <DataTable
        className="mb-6"
        columns={COLUMNS}
        loading={loading}
        isEmpty={reports.length === 0}
        empty="No standalone reports available to merge."
      >
        {sortedReports.map((r) => {
          const isSelected = selectedIds.includes(r.report_id)
          const isAnchor = r.report_id === anchorId
          const breakdown = breakdowns[r.report_id]
          const tier = breakdown ? getMatchTier(breakdown.total_score) : null
          const isExpanded = expandedId === r.report_id

          return (
            <Fragment key={r.report_id}>
              <tr
                className={`border-b border-gray-100 last:border-0 ${
                  isAnchor ? 'bg-blue-50/40' : ''
                }`}
              >
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleReport(r)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-5 py-4 font-semibold text-gray-900">
                  {r.ticket_number}
                  {isAnchor && (
                    <Badge tone="blueStrong" size="sm" className="ml-2">
                      ANCHOR
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-4">
                  <p className="text-gray-900">
                    {r.nearest_landmark || `${r.barangay}, ${r.municipality}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {r.barangay}, {r.municipality}
                  </p>
                </td>
                <td className="px-5 py-4 text-gray-600">{formatDateTime(r.created_at)}</td>
                <td className="px-5 py-4">
                  {isAnchor ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : !anchorId ? (
                    <span className="text-xs text-gray-400">Select an anchor first</span>
                  ) : breakdownLoading && !breakdown ? (
                    <span className="text-xs text-gray-400">Scoring…</span>
                  ) : breakdown ? (
                    <div>
                      <Badge colorClass={tier.badgeClass} className="inline-block uppercase">
                        {breakdown.total_score}% · {tier.label}
                      </Badge>
                      {breakdown.feeder_match === false && (
                        <p className="text-xs text-red-500 font-medium mt-1">Different feeder</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Button
                    variant="neutral"
                    size="toggle"
                    dim={false}
                    onClick={() => setExpandedId(isExpanded ? null : r.report_id)}
                  >
                    {isExpanded ? 'Hide Details ▲' : 'View Details ▾'}
                  </Button>
                </td>
              </tr>
              {isExpanded && (
                <tr className="border-b border-gray-100 last:border-0">
                  <td colSpan={6} className="px-5 py-4 bg-gray-50 space-y-3">
                    <MatchReviewCard
                      title="Report Details"
                      ticketLabel={r.ticket_number}
                      reportId={r.report_id}
                      consumerId={r.consumer_id}
                      barangay={r.barangay}
                      municipality={r.municipality}
                      zone={r.zone}
                      nearestLandmark={r.nearest_landmark}
                      description={r.report_details}
                      photoUrl={r.photo_url}
                      otherHomesAffected={r.other_homes_affected}
                    />
                    {!isAnchor && breakdown && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">
                          Match Breakdown vs Anchor
                        </p>
                        {buildBreakdownFactors(breakdown).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={f.passed ? 'text-green-600' : 'text-gray-300'}>
                              {f.passed ? '✓' : '✗'}
                            </span>
                            <span className={f.passed ? 'text-gray-700' : 'text-gray-400'}>
                              {f.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </DataTable>

      <Button
        size="wide"
        dim={50}
        onClick={handleCreate}
        disabled={selectedIds.length < 2 || creating}
      >
        {creating ? 'Creating…' : `Create Master Ticket (${selectedIds.length} selected)`}
      </Button>
    </div>
  )
}
