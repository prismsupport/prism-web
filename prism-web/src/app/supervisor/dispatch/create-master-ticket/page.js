'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'
import MatchReviewCard from '@/components/dispatch/MatchReviewCard'
import { getMatchTier, buildBreakdownFactors } from '@/lib/scoring/masterTicketScoringConfig'

function generateMasterTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `MT-${date}-${random}`
}

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

    setCooperativeId(myRow.cooperative_id)

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('cooperative_id', myRow.cooperative_id)
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
      setError(masterError.message)
      setCreating(false)
      return
    }

    const { error: linkError } = await supabase
      .from('reports')
      .update({ master_id: newMaster.master_id })
      .in('report_id', selectedIds)

    if (linkError) {
      setError(linkError.message)
      setCreating(false)
      return
    }

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

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold w-12"></th>
              <th className="px-5 py-3 font-semibold">Ticket ID</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold">Reported</th>
              <th className="px-5 py-3 font-semibold">Match vs Anchor</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No standalone reports available to merge.
                </td>
              </tr>
            )}
            {!loading &&
              sortedReports.map((r) => {
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
                          <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            ANCHOR
                          </span>
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
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(r.created_at).toLocaleString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        {isAnchor ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : !anchorId ? (
                          <span className="text-xs text-gray-400">Select an anchor first</span>
                        ) : breakdownLoading && !breakdown ? (
                          <span className="text-xs text-gray-400">Scoring…</span>
                        ) : breakdown ? (
                          <div>
                            <span
                              className={`inline-block text-xs font-bold px-2 py-0.5 rounded uppercase ${tier.badgeClass}`}
                            >
                              {breakdown.total_score}% · {tier.label}
                            </span>
                            {breakdown.feeder_match === false && (
                              <p className="text-xs text-red-500 font-medium mt-1">
                                Different feeder
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : r.report_id)}
                          className="text-xs font-semibold text-blue-700"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-gray-100 last:border-0">
                        <td colSpan={6} className="px-5 py-4 bg-gray-50 space-y-3">
                          <MatchReviewCard
                            title="Report Details"
                            ticketLabel={r.ticket_number}
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
          </tbody>
        </table>
      </div>

      <button
        onClick={handleCreate}
        disabled={selectedIds.length < 2 || creating}
        className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
      >
        {creating
          ? 'Creating…'
          : `Create Master Ticket (${selectedIds.length} selected)`}
      </button>
    </div>
  )
}