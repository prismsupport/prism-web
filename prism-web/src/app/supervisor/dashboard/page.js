'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/lib/supervisor/PermissionsContext'
import { PageLoading } from "@/components/ui/Skeleton";
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Alert from '@/components/ui/Alert';
import AttentionCard from '@/components/dashboard/AttentionCard'
import AccessCard from '@/components/dashboard/AccessCard'
import AdvisorySummary from '@/components/dashboard/AdvisorySummary'
import OverviewTab from '@/components/dashboard/tabs/OverviewTab'
import InsightsTab from '@/components/dashboard/tabs/InsightsTab'
import PerformanceTab from '@/components/dashboard/tabs/PerformanceTab'
import { MAX_ROWS, TABS, RANGES } from '@/lib/dashboard/constants'
import { loadDispatchData, loadAdvisorySummary, loadAttention } from '@/lib/dashboard/loaders'

export default function SupervisorDashboardPage() {
  const { hasFeature, isOwner, featureAccess } = usePermissions()
  const { statusLabel } = useStatusLabels()
  const can = {
    dispatch: hasFeature('dispatch'),
    advisories: hasFeature('advisories'),
    faq: hasFeature('faq'),
  }
  const hasAnyWidget = can.dispatch || can.advisories || can.faq

  const [rangeKey, setRangeKey] = useState('30')
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const latestLoad = useRef(0)

  const range = RANGES.find((r) => r.key === rangeKey)

  useEffect(() => {
    loadDashboard()
  }, [rangeKey])

  async function loadDashboard() {
    const loadId = ++latestLoad.current
    setRefreshing(true)
    setError('')
    try {
      const result = await fetchDashboardData()
      if (loadId !== latestLoad.current) return // a newer load is running
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      if (loadId !== latestLoad.current) return
      setError(err?.message || 'Unable to load the dashboard.')
    }
    setLoading(false)
    setRefreshing(false)
  }

  async function fetchDashboardData() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be signed in.')

    const { data: myRow } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()
    if (!myRow) throw new Error('Unable to load your cooperative.')
    const coopId = myRow.cooperative_id

    let sinceIso = null
    if (range.days) {
      const since = new Date()
      since.setDate(since.getDate() - range.days)
      sinceIso = since.toISOString()
    }

    const [dispatchPart, advisoryPart, attentionPart] = await Promise.all([
      can.dispatch ? loadDispatchData(supabase, coopId, sinceIso, range.days) : null,
      can.advisories ? loadAdvisorySummary(supabase, coopId) : null,
      loadAttention(supabase, coopId, can),
    ])

    return { ...dispatchPart, advisoryCounts: advisoryPart, attention: attentionPart }
  }

  if (loading) return <PageLoading />

  if (!data) {
    return (
      <Alert className="">{error || 'Unable to load the dashboard.'}</Alert>
    )
  }

  const { stats, areaBreakdown, issueData, recurringRows, trend, statusCounts, linemenPerformance, advisoryCounts, attention, stageAverages } = data
  const unresolvedNow = statusCounts
    ? (statusCounts.pending ?? 0) + (statusCounts.dispatched ?? 0) + (statusCounts.in_progress ?? 0) + (statusCounts.qa_review ?? 0)
    : 0

  // Needs-attention cards: only the ones this supervisor can act on
  const attentionItems = []
  if (can.dispatch && statusCounts) {
    attentionItems.push(
      { key: 'pending', label: `${statusLabel('pending')} tickets`, count: statusCounts.pending, href: '/supervisor/dispatch?status=pending', color: 'text-red-600' },
      { key: 'overdue', label: 'Overdue tickets', count: attention.overdue ?? 0, href: '/supervisor/dispatch?status=overdue', color: 'text-red-600' },
      { key: 'qa', label: 'QA reviews waiting', count: statusCounts.qa_review, href: '/supervisor/dispatch?status=qa_review', color: 'text-blue-700' },
      { key: 'reopen', label: 'Reopen requests', count: attention.reopen ?? 0, href: '/supervisor/dispatch', color: 'text-amber-600' }
    )
  }
  if (can.faq) {
    attentionItems.push({ key: 'faq', label: 'Unanswered FAQs', count: attention.faq ?? 0, href: '/supervisor/faq', color: 'text-amber-600' })
  }
  const allClear = attentionItems.length > 0 && attentionItems.every((i) => i.count === 0)

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {can.dispatch
              ? `Outage reporting, dispatch, and repair performance: ${range.label.toLowerCase()}. Status, attention, and duty figures are always current.`
              : 'A summary of the areas you manage.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {can.dispatch && (
            <SegmentedControl
              options={RANGES}
              value={rangeKey}
              onChange={setRangeKey}
              disabled={refreshing}
            />
          )}
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated{' '}
              {lastUpdated.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={loadDashboard}
            disabled={refreshing}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <Alert>{error}</Alert>

      {data.truncated && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          This period has more than {MAX_ROWS} records, so the figures below cover the most
          recent {MAX_ROWS}. Choose a shorter period for exact numbers.
        </p>
      )}

      {!hasAnyWidget && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            No dashboard widgets are available for your account yet.
          </p>
          <p className="text-sm text-gray-500">
            Ask your cooperative owner to assign features to your account.
          </p>
        </div>
      )}

      {/* Needs attention */}
      {attentionItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Needs Attention</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {attentionItems.map((item) => (
              <AttentionCard
                key={item.key}
                label={item.label}
                count={item.count}
                href={item.href}
                color={item.color}
              />
            ))}
          </div>
          {allClear && (
            <p className="text-xs text-gray-400 mt-2">Nothing needs your attention right now.</p>
          )}
        </div>
      )}

      {!can.dispatch && can.advisories && advisoryCounts && (
        <AdvisorySummary
          counts={advisoryCounts}
          className="mb-6"
          manageHref="/supervisor/advisories"
        />
      )}

      <AccessCard isOwner={isOwner} featureAccess={featureAccess} />

      {can.dispatch && stats && (
        <>
          <div className="mb-6">
            <SegmentedControl options={TABS} value={tab} onChange={setTab} />
          </div>

          {tab === 'overview' && (
            <OverviewTab
              stats={stats}
              unresolvedNow={unresolvedNow}
              statusCounts={statusCounts}
              trend={trend}
              rangeKey={rangeKey}
              advisoryCounts={advisoryCounts}
              showAdvisories={can.advisories}
            />
          )}

          {tab === 'insights' && (
            <InsightsTab
              stats={stats}
              areaBreakdown={areaBreakdown}
              issueData={issueData}
              recurringRows={recurringRows}
            />
          )}

          {tab === 'performance' && (
            <PerformanceTab
              stats={stats}
              stageAverages={stageAverages}
              linemenPerformance={linemenPerformance}
            />
          )}
        </>
      )}

    </div>
  )
}