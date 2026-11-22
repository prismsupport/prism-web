'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageLoading } from '@/components/ui/Skeleton'
import { issueLabel } from '@/lib/issueCodes'
import { toast } from '@/lib/toast'
import {
  loadIssueCodes,
  loadConsumerNames,
  loadDominantCategory,
  groupByCategory,
  matchesSearch,
  sameCategory,
} from '@/lib/ticketGrouping'
import CategoryGroupHeader, { CategoryMismatchTag } from '@/components/dispatch/CategoryGroupHeader'
import Alert from '@/components/ui/Alert'
import ReportMap from '@/components/ui/ReportMap'
import SearchInput from '@/components/ui/SearchInput'
import SuggestionConfidenceBanner from '@/components/dispatch/SuggestionConfidenceBanner'
import MatchReviewCard from '@/components/dispatch/MatchReviewCard'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'

function generateMasterTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `MT-${date}-${random}`
}

function JoinGroupReviewContent() {
  const { targetType, targetId } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const reportIds = (searchParams.get('reports') || '').split(',').filter(Boolean)
  const isTargetMaster = targetType === 'master'

  const [cooperativeId, setCooperativeId] = useState(null)
  const [targetDetails, setTargetDetails] = useState(null)
  const [targetLat, setTargetLat] = useState(null)
  const [targetLng, setTargetLng] = useState(null)
  const [targetStatus, setTargetStatus] = useState(null)
  const [targetPhotoUrl, setTargetPhotoUrl] = useState(null)
  const [targetCode, setTargetCode] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [names, setNames] = useState({})
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [targetId, targetType])

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

    if (isTargetMaster) {
      const { data: geo } = await supabase
        .rpc('get_master_ticket_with_location', { p_master_id: targetId })
        .single()
      setTargetLat(geo?.lat)
      setTargetLng(geo?.lng)

      const { data: masterRow, error: masterError } = await supabase
        .from('master_tickets')
        .select('*')
        .eq('master_id', targetId)
        .single()

      if (masterError || !masterRow) {
        setError('This master ticket no longer exists.')
        setLoading(false)
        return
      }
      setTargetStatus(masterRow.status)
      setTargetDetails(masterRow)
      setTargetCode(await loadDominantCategory(supabase, targetId))
    } else {
      const { data: geo, error: reportError } = await supabase
        .rpc('get_report_with_location', { p_report_id: targetId })
        .single()

      if (reportError || !geo) {
        setError('This report no longer exists.')
        setLoading(false)
        return
      }
      setTargetLat(geo.lat)
      setTargetLng(geo.lng)
      setTargetStatus(geo.status)
      setTargetDetails(geo)

      const targetCodes = await loadIssueCodes(supabase, [targetId])
      setTargetCode(targetCodes[targetId] ?? null)

      if (geo.photo_url) {
        const { data: signed } = await supabase.storage
          .from('report-photos')
          .createSignedUrl(geo.photo_url, 3600)
        if (signed) setTargetPhotoUrl(signed.signedUrl)
      }
    }

    const results = await Promise.all(
      reportIds.map(async (id) => {
        const { data: report } = await supabase
          .rpc('get_report_with_location', { p_report_id: id })
          .single()

        if (!report) return null

        let photoUrl = null
        if (report.photo_url) {
          const { data: signed } = await supabase.storage
            .from('report-photos')
            .createSignedUrl(report.photo_url, 3600)
          if (signed) photoUrl = signed.signedUrl
        }

        const breakdownRpc = isTargetMaster
          ? supabase.rpc('get_match_breakdown_against_master', {
              p_report_id: id,
              p_master_id: targetId,
            })
          : supabase.rpc('get_match_breakdown', {
              p_report_id_a: id,
              p_report_id_b: targetId,
            })
        const { data: breakdown } = await breakdownRpc.single()

        return { report, breakdown, photoUrl, checked: true }
      })
    )

    const found = results.filter(Boolean)
    const [codes, nameMap] = await Promise.all([
      loadIssueCodes(
        supabase,
        found.map((c) => c.report.report_id)
      ),
      loadConsumerNames(
        supabase,
        found.map((c) => c.report.consumer_id)
      ),
    ])

    setNames(nameMap)
    setCandidates(found.map((c) => ({ ...c, code: codes[c.report.report_id] ?? null })))
    setLoading(false)
  }

  function toggleChecked(reportId) {
    setCandidates((prev) =>
      prev.map((c) => (c.report.report_id === reportId ? { ...c, checked: !c.checked } : c))
    )
  }

  async function handleConfirmJoin() {
    const checkedCandidates = candidates.filter((c) => c.checked)
    if (checkedCandidates.length === 0) {
      setError('Select at least one report to join.')
      return
    }

    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const checkedIds = checkedCandidates.map((c) => c.report.report_id)

    if (isTargetMaster) {
      const { error: updateError } = await supabase
        .from('reports')
        .update({ master_id: targetId, status: targetStatus })
        .in('report_id', checkedIds)

      if (updateError) {
        toast.error(updateError.message)
        setError(updateError.message)
        setActionLoading(false)
        return
      }

      const { data: masterRow } = await supabase
        .from('master_tickets')
        .select('report_count')
        .eq('master_id', targetId)
        .single()

      await supabase
        .from('master_tickets')
        .update({ report_count: (masterRow?.report_count || 1) + checkedIds.length })
        .eq('master_id', targetId)
    } else {
      const { data: newMaster, error: masterError } = await supabase
        .from('master_tickets')
        .insert({
          master_ticket: generateMasterTicketNumber(),
          cooperative_id: cooperativeId,
          barangay: targetDetails.barangay,
          municipality: targetDetails.municipality,
          location: `POINT(${targetLng} ${targetLat})`,
          priority: targetDetails.priority,
          report_count: checkedIds.length + 1,
          status: targetStatus,
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
        .update({ master_id: newMaster.master_id, status: targetStatus })
        .in('report_id', [targetId, ...checkedIds])

      if (linkError) {
        toast.error(linkError.message)
        setError(linkError.message)
        setActionLoading(false)
        return
      }

      await supabase
        .from('job_assignments')
        .update({ master_id: newMaster.master_id })
        .eq('report_id', targetId)
    }

    toast.success('Reports joined')
    router.push('/supervisor/dispatch')
  }

  function handleReject() {
    router.push('/supervisor/dispatch')
  }

  if (loading) return <PageLoading />

  if (error && candidates.length === 0) {
    return (
      <div>
        <Alert className="">{error}</Alert>
        <BackToDispatchLink />
      </div>
    )
  }

  const checkedCount = candidates.filter((c) => c.checked).length
  const bestScore =
    candidates.length > 0 ? Math.max(...candidates.map((c) => c.breakdown?.total_score || 0)) : 0
  const mismatchCount = candidates.filter((c) => !sameCategory(c.code, targetCode)).length
  const targetTicket = isTargetMaster ? targetDetails?.master_ticket : targetDetails?.ticket_number

  const visibleItems = candidates
    .filter((c) =>
      matchesSearch(
        [
          c.report.ticket_number,
          names[c.report.consumer_id],
          c.report.nearest_landmark,
          c.report.zone,
          c.report.barangay,
          c.report.municipality,
          c.report.report_details,
          issueLabel(c.code),
        ],
        searchText
      )
    )
    .map((c) => ({
      c,
      id: c.report.report_id,
      code: c.code,
      score: c.breakdown?.total_score,
      created: c.report.created_at,
    }))
  const groups = groupByCategory(visibleItems, { anchorCode: targetCode, hasAnchor: true })

  function renderCandidate({ c }) {
    const differs = !sameCategory(c.code, targetCode)
    return (
      <div
        key={c.report.report_id}
        className={`bg-white rounded-xl border p-4 ${
          c.checked ? 'border-blue-300' : 'border-gray-200 opacity-60'
        }`}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={c.checked}
            onChange={() => toggleChecked(c.report.report_id)}
            className="w-4 h-4 mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.report.ticket_number}</p>
                {names[c.report.consumer_id] && (
                  <p className="text-xs text-gray-400">{names[c.report.consumer_id]}</p>
                )}
              </div>
              {c.breakdown && (
                <span className="text-xs font-bold text-green-600">
                  {c.breakdown.total_score}% match
                </span>
              )}
            </div>
            {differs && (
              <CategoryMismatchTag
                code={c.code}
                referenceCode={targetCode}
                referenceLabel="existing ticket"
              />
            )}
            <MatchReviewCard
              title="Report Details"
              ticketLabel={c.report.ticket_number}
              reportId={c.report.report_id}
              consumerId={c.report.consumer_id}
              barangay={c.report.barangay}
              municipality={c.report.municipality}
              zone={c.report.zone}
              nearestLandmark={c.report.nearest_landmark}
              description={c.report.report_details}
              photoUrl={c.photoUrl}
              otherHomesAffected={c.report.other_homes_affected}
            />
            {c.breakdown?.feeder_match === false && (
              <p className="text-xs text-red-600 font-medium mt-2">✗ Different feeder</p>
            )}
            {c.breakdown?.feeder_match === true && (
              <p className="text-xs text-green-600 font-medium mt-2">✓ Same feeder</p>
            )}
          </div>
        </label>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[18rem]">
        <ReportMap
          markers={[
            {
              lat: targetLat,
              lng: targetLng,
              label: `Existing: ${targetTicket}`,
              priority: targetDetails?.priority ?? null,
            },
            ...candidates.map((c) => ({
              lat: c.report.lat,
              lng: c.report.lng,
              label: c.report.ticket_number,
              priority: c.report.priority ?? null,
            })),
          ]}
        />
      </div>

      <div className="overflow-y-auto space-y-6">
        <SuggestionConfidenceBanner
          title={`${candidates.length} Possible Match${candidates.length === 1 ? '' : 'es'}`}
          confidence={bestScore}
          theme="purple"
          description={
            <>
              These {candidates.length} report{candidates.length === 1 ? '' : 's'} may belong to{' '}
              {targetTicket}, which is already{' '}
              {isTargetMaster ? 'a Master Ticket' : 'being worked on'}. Uncheck any report below
              that doesn&apos;t actually belong before confirming.
              {mismatchCount > 0 && (
                <>
                  {' '}
                  {mismatchCount} report{mismatchCount === 1 ? ' has' : 's have'} a different
                  category from the existing ticket ({issueLabel(targetCode)}). They are listed
                  separately below; the consumer may have chosen another label for the same fault.
                </>
              )}
            </>
          }
        />

        <MatchReviewCard
          title={isTargetMaster ? 'Existing Master Ticket' : 'Existing Report'}
          ticketLabel={targetTicket}
          reportId={isTargetMaster ? null : targetId}
          consumerId={isTargetMaster ? null : targetDetails?.consumer_id}
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

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase">
            Incoming Reports ({checkedCount} of {candidates.length} selected)
          </p>

          <SearchInput
            value={searchText}
            onChange={setSearchText}
            placeholder="Search name, ticket no., landmark, barangay, category…"
          />

          {groups.length === 0 && (
            <p className="text-sm text-gray-500">No reports match your search.</p>
          )}

          {groups.map((g) => (
            <div key={g.key} className="space-y-3">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <CategoryGroupHeader
                  label={g.label}
                  count={g.items.length}
                  hasAnchor
                  matchesAnchor={g.matchesAnchor}
                  referenceLabel="existing ticket"
                />
              </div>
              {g.items.map(renderCandidate)}
            </div>
          ))}
        </div>

        <Alert>{error}</Alert>

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            None Are Matches
          </button>
          <button
            onClick={handleConfirmJoin}
            disabled={actionLoading || checkedCount === 0}
            className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            {actionLoading ? 'Joining…' : `Join ${checkedCount} Selected`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function JoinGroupReviewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
      <JoinGroupReviewContent />
    </Suspense>
  )
}