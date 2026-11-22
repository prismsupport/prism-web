'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { generateMasterTicketNumber } from '@/lib/dispatch/masterTicketNumber'
import { formatDateTime } from '@/lib/format'
import { issueLabel } from '@/lib/issueCodes'
import { getMatchTier, buildBreakdownFactors } from '@/lib/scoring/masterTicketScoringConfig'
import { toast } from '@/lib/toast'
import {
  loadIssueCodes,
  loadConsumerNames,
  groupByCategory,
  matchesSearch,
  sameCategory,
} from '@/lib/ticketGrouping'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'
import MatchReviewCard from '@/components/dispatch/MatchReviewCard'
import CategoryGroupHeader, { CategoryMismatchTag } from '@/components/dispatch/CategoryGroupHeader'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import SearchInput from '@/components/ui/SearchInput'
import usePagination from '@/lib/usePagination'

const COLUMNS = [
  { label: '', className: 'w-12' },
  'Ticket ID',
  'Category',
  'Location',
  'Reported',
  'Match vs Anchor',
  '',
]

export default function CreateMasterTicketPage() {
  const router = useRouter()

  const [cooperativeId, setCooperativeId] = useState(null)
  const [reports, setReports] = useState([])
  const [issueCodes, setIssueCodes] = useState({})
  const [names, setNames] = useState({})
  const [searchText, setSearchText] = useState('')
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

    const [codes, nameMap] = await Promise.all([
      loadIssueCodes(supabase, reportIds),
      loadConsumerNames(
        supabase,
        withSignedPhotos.map((r) => r.consumer_id)
      ),
    ])

    setIssueCodes(codes)
    setNames(nameMap)
    setReports(withSignedPhotos)
    setLoading(false)
  }

  const anchorId = selectedIds[0] || null
  const anchorReport = reports.find((r) => r.report_id === anchorId) || null
  const anchorCode = anchorId ? issueCodes[anchorId] ?? null : null

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
    const isAnchor = selectedIds[0] === report.report_id
    const becomesAnchor = !selectedIds.includes(report.report_id) && selectedIds.length === 0
    if (isAnchor || becomesAnchor) pg.setPage(1)

    setSelectedIds((prev) => {
      if (prev.includes(report.report_id)) {
        return prev.filter((id) => id !== report.report_id)
      }
      return [...prev, report.report_id]
    })
  }

  // Anchor first, then the other reports grouped by category.
  // Inside a group: highest match percentage first.
  const items = reports.map((r) => ({
    report: r,
    id: r.report_id,
    code: issueCodes[r.report_id] ?? null,
    score: breakdowns[r.report_id]?.total_score,
    created: r.created_at,
  }))
  const anchorItem = items.find((i) => i.id === anchorId) || null
  const others = items
    .filter((i) => i.id !== anchorId)
    .filter((i) =>
      matchesSearch(
        [
          i.report.ticket_number,
          names[i.report.consumer_id],
          i.report.nearest_landmark,
          i.report.zone,
          i.report.barangay,
          i.report.municipality,
          i.report.report_details,
          issueLabel(i.code),
        ],
        searchText
      )
    )
  const groups = groupByCategory(others, { anchorCode, hasAnchor: !!anchorItem })
  const flat = [
    ...(anchorItem ? [{ item: anchorItem, group: null }] : []),
    ...groups.flatMap((g) => g.items.map((item) => ({ item, group: g }))),
  ]
  const pg = usePagination(flat)

  const mismatchCount = selectedIds
    .slice(1)
    .filter((id) => !sameCategory(issueCodes[id] ?? null, anchorCode)).length

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
        Select the first report to use as your anchor. Every other report then shows its match
        score and breakdown against it, grouped by category and sorted from the highest match to
        the lowest, so you can handpick which ones actually belong together instead of guessing by
        distance alone. The category is shown beside the score and is not part of the percentage.
      </p>
      {!anchorId && (
        <p className="text-xs text-amber-600 font-medium mb-4">
          No anchor selected yet. Pick any report below to see match scores.
        </p>
      )}
      {anchorId && <div className="mb-4" />}

      <SearchInput
        className="mb-4"
        value={searchText}
        onChange={(v) => {
          setSearchText(v)
          pg.setPage(1)
        }}
        placeholder="Search ticket no., consumer name, landmark, barangay, municipality, category…"
      />

      <Alert>{error}</Alert>

      <DataTable
        className="mb-6"
        columns={COLUMNS}
        loading={loading}
        isEmpty={flat.length === 0}
        empty={
          searchText.trim()
            ? 'No reports match your search.'
            : 'No standalone reports available to merge.'
        }
        footer={!loading && <Pagination {...pg.paginationProps} />}
      >
        {pg.pageItems.map(({ item, group }, idx) => {
          const r = item.report
          const isSelected = selectedIds.includes(r.report_id)
          const isAnchor = r.report_id === anchorId
          const breakdown = breakdowns[r.report_id]
          const tier = breakdown ? getMatchTier(breakdown.total_score) : null
          const isExpanded = expandedId === r.report_id
          const prevGroup = idx > 0 ? pg.pageItems[idx - 1].group : undefined
          const showHeader = group && (idx === 0 || prevGroup?.key !== group.key)
          const differs = anchorId && !isAnchor && !sameCategory(item.code, anchorCode)

          return (
            <Fragment key={r.report_id}>
              {showHeader && (
                <tr className="border-b border-gray-100 bg-gray-50">
                  <td colSpan={7} className="px-5 py-2">
                    <CategoryGroupHeader
                      label={group.label}
                      count={group.items.length}
                      hasAnchor={!!anchorItem}
                      matchesAnchor={group.matchesAnchor}
                    />
                  </td>
                </tr>
              )}
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
                  {names[r.consumer_id] && (
                    <p className="text-xs font-normal text-gray-400">{names[r.consumer_id]}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-700">{issueLabel(item.code)}</td>
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
                      {differs && (
                        <CategoryMismatchTag code={item.code} referenceCode={anchorCode} />
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
                  <td colSpan={7} className="px-5 py-4 bg-gray-50 space-y-3">
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
                        <div className="flex items-center gap-2 text-xs">
                          <span className={differs ? 'text-gray-300' : 'text-green-600'}>
                            {differs ? '✗' : '✓'}
                          </span>
                          <span className={differs ? 'text-gray-400' : 'text-gray-700'}>
                            {differs
                              ? `Different category (${issueLabel(item.code)} vs ${issueLabel(anchorCode)}). Shown for review, not part of the percentage`
                              : 'Same category as the anchor'}
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </DataTable>

      {mismatchCount > 0 && (
        <p className="mb-3 max-w-2xl rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {mismatchCount} selected report{mismatchCount === 1 ? ' has' : 's have'} a different
          category from the anchor. Merge them only if you are sure they are the same fault.
        </p>
      )}

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