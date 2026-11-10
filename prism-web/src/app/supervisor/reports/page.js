'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { loadReportData, loadFilterOptions } from '@/lib/reports/loadReportData'
import { formatMinutes } from '@/lib/performance'
import usePagination from '@/lib/usePagination'
import { toast } from '@/lib/toast'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import { PageLoading } from '@/components/ui/Skeleton'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterMenu, FilterChips } from '@/components/ui/FilterMenu'
import MetricCard from '@/components/dashboard/MetricCard'
import BarList from '@/components/dashboard/BarList'
import AreaBreakdown from '@/components/dashboard/AreaBreakdown'
import StageBreakdown from '@/components/dashboard/StageBreakdown'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import ReportTrendChart from '@/components/reports/ReportTrendChart'
import Button from '@/components/ui/Button'
import useCooperativeProfile from '@/lib/supervisor/useCooperativeProfile'
import { loadLogoImage } from '@/lib/reports/loadLogoImage'
import { exportReportToExcel } from '@/lib/reports/exportExcel'
import { exportReportToPdf } from '@/lib/reports/exportPdf'
import { formatDuration } from '@/lib/stageTimes'
import { RECURRING_MIN_REPORTS } from '@/lib/recurring'
import { ISSUE_LABELS } from '@/lib/issueCodes'
import { usePermissions } from '@/lib/supervisor/PermissionsContext'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'

const RANGES = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
  { key: 'custom', label: 'Custom' },
]

// One tab at a time instead of one long page. Exports still include every section.
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'locations', label: 'Locations' },
  { key: 'times', label: 'Response & Resolution' },
  { key: 'linemen', label: 'Lineman Performance' },
]

function toDateInput(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function presetDates(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: toDateInput(from), to: toDateInput(to) }
}

const DATE_INPUT =
  'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600'

const LINEMAN_COLUMNS = [
  { label: 'Lineman', className: 'text-center' },
  { label: 'Area Office', className: 'text-center' },
  { label: 'Jobs Completed', className: 'text-center' },
  { label: 'Avg. Repair Time', className: 'text-center' },
  { label: 'Avg. Travel', className: 'text-center' },
  { label: 'Avg. On-site', className: 'text-center' },
  { label: 'Avg. Rating', className: 'text-center' },
  { label: 'Ratings', className: 'text-center' },
]

const REOPEN_LABELS = {
  consumer: 'Consumer request',
  supervisor: 'Supervisor',
  qa_rejection: 'QA rejection',
}

// good: 'up' when a rise is good news, 'down' when a rise is bad, null when neutral
function DeltaBadge({ delta, good }) {
  if (!delta || delta.pct == null) return null
  const up = delta.pct > 0
  const flat = delta.pct === 0
  let tone = 'text-gray-500'
  if (!flat && good) tone = (good === 'up') === up ? 'text-green-600' : 'text-red-600'
  return (
    <span className={`font-semibold ${tone}`}>
      {flat ? '0%' : `${up ? '+' : ''}${delta.pct}%`} vs previous
    </span>
  )
}

function withDelta(text, delta, good) {
  if (!delta || delta.pct == null) return text
  return (
    <>
      {text ? <>{text} · </> : null}
      <DeltaBadge delta={delta} good={good} />
    </>
  )
}

function Section({ title, description, children, className = '' }) {
  return (
    <section
      className={`flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {description && <p className="mb-4 mt-1 text-xs text-gray-400">{description}</p>}
      {!description && <div className="mb-4" />}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  )
}

function MiniStat({ label, value, tone = 'text-gray-900', foot }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`font-display mt-1 text-3xl font-extrabold tabular-nums ${tone}`}>{value}</p>
      {foot ? <p className="mt-0.5 text-xs">{foot}</p> : null}
    </div>
  )
}

// Same colours as the Dashboard status bar
const STATUS_BAR = {
  pending: 'bg-red-500',
  dispatched: 'bg-amber-400',
  in_progress: 'bg-orange-500',
  qa_review: 'bg-blue-600',
  resolved: 'bg-green-500',
  cancelled: 'bg-gray-300',
}

// Colour by position in the cooperative's own priority list (lowest to highest)
function priorityBar(label, levels) {
  const i = levels.findIndex((l) => l.label === label)
  if (i === -1) return 'bg-gray-300' // "Not set"
  if (levels.length === 1) return 'bg-blue-600'
  const pos = i / (levels.length - 1)
  if (pos >= 1) return 'bg-red-600'
  if (pos >= 0.6) return 'bg-red-400'
  if (pos >= 0.3) return 'bg-amber-400'
  return 'bg-blue-400'
}

export default function ReportsPage() {
  const [coopId, setCoopId] = useState(null)
  const [options, setOptions] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { name: coopName, logoUrl } = useCooperativeProfile()
  const [tab, setTab] = useState('overview')

  const [rangeKey, setRangeKey] = useState('7')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [municipality, setMunicipality] = useState('all')
  const [barangay, setBarangay] = useState('all')
  const [feeder, setFeeder] = useState('all')
  const [areaOffice, setAreaOffice] = useState('all')
  const [category, setCategory] = useState('all')
  const [priority, setPriority] = useState('all')
  const [status, setStatus] = useState('all')
  const [compare, setCompare] = useState(false)
  const [supervisorName, setSupervisorName] = useState('')
  const { isOwner } = usePermissions()
  const { statusLabel, priorityLevels } = useStatusLabels()

  const latestLoad = useRef(0)
  const linemanPg = usePagination(data?.linemen || [])

  useEffect(() => {
    linemanPg.setPage(1)
  }, [data])

  // The dates actually used for loading
  let from = null
  let to = null
  if (rangeKey === 'custom') {
    from = customFrom || null
    to = customTo || null
  } else {
    const range = RANGES.find((r) => r.key === rangeKey)
    if (range?.days) ({ from, to } = presetDates(range.days))
  }
  const dateError = from && to && from > to ? 'The start date must be on or before the end date.' : ''

  // One-time setup: cooperative and filter options
  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const id = await getMyCooperativeId(supabase)
      if (!id) {
        toast.error('Unable to load your cooperative.')
        setLoading(false)
        return
      }
      setCoopId(id)
      setOptions(await loadFilterOptions(supabase, id))
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: me } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()
        if (me) setSupervisorName(`${me.first_name} ${me.last_name}`)
      }
    }
    init()
  }, [])

  // Reload whenever a filter changes
  useEffect(() => {
    if (!coopId || dateError) return
    const loadId = ++latestLoad.current
    setRefreshing(true)

    loadReportData(createClient(), coopId, {
      from,
      to,
      municipality,
      barangay,
      feeder,
      areaOffice,
      category,
      priority,
      status,
      compare: compare && rangeKey !== 'all',
    })
      .then((result) => {
        if (loadId !== latestLoad.current) return
        setData(result)
      })
      .catch((err) => {
        if (loadId !== latestLoad.current) return
        toast.error(err?.message || 'Unable to load the report.')
      })
      .finally(() => {
        if (loadId !== latestLoad.current) return
        setLoading(false)
        setRefreshing(false)
      })
  }, [coopId, rangeKey, customFrom, customTo, municipality, barangay, feeder, areaOffice, category, priority, status, compare])

  const filters = [
    {
      key: 'municipality',
      label: 'Municipality',
      value: municipality,
      onChange: (v) => {
        setMunicipality(v)
        setBarangay('all')
      },
      options: [
        { value: 'all', label: 'All Municipalities' },
        ...(options?.municipalities || []).map((m) => ({ value: m, label: m })),
      ],
    },
    {
      key: 'barangay',
      label: 'Barangay',
      value: barangay,
      onChange: setBarangay,
      options: [
        { value: 'all', label: 'All Barangays' },
        ...(options?.barangays || []).filter(
          (b) => municipality === 'all' || b.value.endsWith(`|${municipality}`)
        ),
      ],
    },
    {
      key: 'feeder',
      label: 'Feeder',
      value: feeder,
      onChange: setFeeder,
      options: [
        { value: 'all', label: 'All Feeders' },
        ...(options?.feeders || []).map((f) => ({ value: f, label: f })),
      ],
    },
    {
      key: 'areaOffice',
      label: 'Area Office',
      value: areaOffice,
      onChange: setAreaOffice,
      options: [
        { value: 'all', label: 'All Area Offices' },
        ...(options?.areaOffices || []).map((a) => ({ value: a, label: a })),
      ],
    },
    {
      key: 'category',
      label: 'Category',
      value: category,
      onChange: setCategory,
      options: [
        { value: 'all', label: 'All Categories' },
        ...Object.entries(ISSUE_LABELS).map(([code, label]) => ({ value: code, label })),
        { value: 'uncategorized', label: 'Uncategorized' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      value: priority,
      onChange: setPriority,
      options: [
        { value: 'all', label: 'All Priorities' },
        ...priorityLevels.map((p) => ({ value: p.key, label: p.label })),
        { value: 'none', label: 'Not set' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      value: status,
      onChange: setStatus,
      options: [
        { value: 'all', label: 'All Statuses' },
        ...['pending', 'dispatched', 'in_progress', 'qa_review', 'resolved', 'cancelled'].map((k) => ({
          value: k,
          label: statusLabel(k),
        })),
      ],
    },
  ]

  async function handleExport(kind) {
    if (!data || exporting) return
    setMenuOpen(false)
    setExporting(true)
    try {
      let periodLabel = 'All time'
      if (rangeKey === 'custom') {
        periodLabel = `${customFrom || 'Start'} to ${customTo || 'today'}`
      } else if (from) {
        periodLabel = `${RANGES.find((r) => r.key === rangeKey)?.label} (${from} to ${to})`
      }

      const logo = kind === 'pdf' ? await loadLogoImage(logoUrl) : null

      const meta = {
        cooperativeName: coopName,
        logo, // { dataUrl, width, height } or null
        preparedBy: { name: supervisorName, role: isOwner ? 'Cooperative Owner' : 'Supervisor' },
        statusLabel,
        periodLabel,
        generatedAt: new Date().toLocaleString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        filters: filters.map((f) => ({
          label: f.label,
          value: f.options.find((o) => o.value === f.value)?.label ?? f.value,
        })),
      }

      if (kind === 'pdf') {
        await exportReportToPdf(data, meta)
        toast.success('PDF report downloaded')
      } else {
        await exportReportToExcel(data, meta)
        toast.success('Excel report downloaded')
      }
    } catch (err) {
      toast.error(`Could not create the ${kind === 'pdf' ? 'PDF' : 'Excel'} file. Please try again.`)
    }
    setExporting(false)
  }

  if (loading) return <PageLoading />
  const summary = data?.summary
  const cmp = data?.comparison

  return (
    <div>
      <PageHeader
        title="Reports"
        actions={
          <div className="relative">
            <Button
              variant="neutral"
              dim={false}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              disabled={!data || refreshing || exporting}
              className="whitespace-nowrap disabled:opacity-60"
            >
              {exporting ? 'Preparing…' : 'Export ▾'}
            </Button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close export menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport('xlsx')}
                    className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport('pdf')}
                    className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    PDF (.pdf)
                  </button>
                </div>
              </>
            )}
          </div>
        }
        description="Outage frequency, issue categories, locations, response and resolution times, recurring incidents, and lineman performance for the period and area you choose."
      />

      <div className="-mx-1 bg-gray-50 px-1 pt-1">
        <FilterBar className="mb-4 flex flex-wrap items-center gap-3">
          <SegmentedControl options={RANGES} value={rangeKey} onChange={setRangeKey} disabled={refreshing} />

          {rangeKey === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="Start date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={DATE_INPUT}
              />
              <span className="text-sm text-gray-400">to</span>
              <input
                type="date"
                aria-label="End date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className={DATE_INPUT}
              />
            </div>
          )}

          <label
            className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"
            title={rangeKey === 'all' ? 'Not available for All time' : undefined}
          >
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={compare && rangeKey !== 'all'}
              disabled={refreshing || rangeKey === 'all'}
              onChange={(e) => setCompare(e.target.checked)}
            />
            Compare with previous period
          </label>

          <div className="ml-auto">
            <FilterMenu filters={filters} label="Filters" />
          </div>
          <FilterChips filters={filters} />
        </FilterBar>
      </div>

      <Alert>{dateError}</Alert>

      {rangeKey === 'all' && (
        <Alert tone="info" className="mb-4">
          All time loads every report and can be slow for a large cooperative. Choose a shorter
          period if it takes too long. Comparison with a previous period is not available here.
        </Alert>
      )}

      {data?.truncated && (
        <p className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This period has more than 20,000 records, so the figures cover the most recent ones.
          Choose a shorter period for exact numbers.
        </p>
      )}

      {summary && (
        <div
          className={`grid grid-cols-2 gap-3 md:grid-cols-4 transition-opacity ${
            refreshing ? 'opacity-60' : ''
          }`}
        >
          <MetricCard
            compact
            label="Total outage reports"
            value={summary.totalReports}
            hint={
              withDelta(
                summary.declinedReports > 0 ? `${summary.declinedReports} declined` : '',
                cmp?.deltas.totalReports,
                null
              ) || undefined
            }
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect width="8" height="4" x="8" y="2" rx="1" />
          </MetricCard>
          <MetricCard compact tone="green" label="Reports resolved"
            value={summary.resolvedReports}
            hint={withDelta('', cmp?.deltas.resolvedReports, 'up') || undefined}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </MetricCard>
          <MetricCard
            compact
            tone="amber"
            label="Avg. response time"
            value={formatMinutes(summary.avgResponse)}
            hint={withDelta('Submission to first dispatch', cmp?.deltas.avgResponse, 'down')}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </MetricCard>
          <MetricCard
            compact
            label="Avg. resolution time"
            value={formatMinutes(summary.avgResolution)}
            hint={withDelta('Submission to final completion', cmp?.deltas.avgResolution, 'down')}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </MetricCard>
        </div>
      )}

      {cmp && (
        <p className="mt-2 text-xs text-gray-400">
          Percentages compare with the previous period ({cmp.from} to {cmp.to}).
        </p>
      )}

      {data && (
        <>
          <div className="mt-4 mb-4">
            <SegmentedControl options={TABS} value={tab} onChange={setTab} />
          </div>

          <div className={`space-y-4 transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
            {tab === 'overview' && (
              <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section title="Outage Frequency" description="Reports filed over the selected period.">
                  <ReportTrendChart data={data.trend} unit={data.trendUnit} />
                </Section>
                <Section
                  title="Issue Categories"
                  description="Category chosen by the consumer. Older reports show as Uncategorized."
                >
                  <BarList
                    rows={data.issues}
                    showShare
                    emptyTitle="No reports in this period"
                    emptyDescription="Try a wider date range or fewer location filters."
                  />
                </Section>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section
                  title="Priority and Status"
                  description="Priority set by supervisors and the current status of these reports."
                >
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">By priority</p>
                  <BarList
                    rows={data.byPriority.map((p) => [p.label, p.count, priorityBar(p.label, priorityLevels)])}
                    showRank={false}
                    showShare
                    emptyTitle="No reports in this period"
                    emptyDescription="Try a wider date range or fewer filters."
                  />
                  <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-gray-400">By status</p>
                  <BarList
                    rows={data.byStatus
                      .filter((p) => p.count > 0)
                      .map((p) => [statusLabel(p.key), p.count, STATUS_BAR[p.key] || 'bg-gray-300'])}
                    showRank={false}
                    showShare
                    emptyTitle="No reports in this period"
                    emptyDescription="Try a wider date range or fewer filters."
                  />
                </Section>

                <div className="flex flex-col gap-4">
                  <Section
                    title="Consolidation"
                    description="Master Tickets group duplicate reports into one dispatch."
                    className="!h-auto"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <MiniStat label="Reports merged" value={data.consolidation.mergedReports} />
                      <MiniStat label="Master Tickets" value={data.consolidation.masterTickets} />
                      <MiniStat
                        label="Dispatches avoided"
                        value={data.consolidation.dispatchesAvoided}
                        tone="text-green-700"
                      />
                    </div>
                  </Section>

                  <Section
                    title="Reopened Tickets"
                    description="Reopens send a job back to a lineman."
                    className="flex-1"
                  >
                    <div className="mb-5 flex items-end gap-3">
                      <p className="font-display text-4xl font-extrabold tabular-nums text-gray-900">
                        {summary.reopenedCount}
                      </p>
                      <p className="pb-1 text-xs">
                        <DeltaBadge delta={cmp?.deltas.reopenedCount} good="down" />
                      </p>
                    </div>
                    <BarList
                      rows={Object.entries(summary.reopenSources || {}).map(([src, n]) => [
                        REOPEN_LABELS[src] || src,
                        n,
                        'bg-amber-400',
                      ])}
                      showRank={false}
                      emptyTitle="No reopened tickets"
                      emptyDescription="Nothing was sent back to a lineman in this period."
                    />
                  </Section>
                </div>
              </div>
              </>
            )}

            {tab === 'locations' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AreaBreakdown breakdown={data.locations} />
                <Section
                  title="Recurring Incidents"
                  description={`The same category reported ${RECURRING_MIN_REPORTS} or more times in the same barangay within the selected period. ${summary.reopenedCount} ticket${summary.reopenedCount === 1 ? ' was' : 's were'} reopened in this period.`}
                >
                  <BarList
                    rows={data.recurring.map((g) => [
                      `${g.label} · ${g.barangay}${g.municipality ? ` (${g.municipality})` : ''}`,
                      g.count,
                    ])}
                    emptyTitle="No recurring incidents"
                    emptyDescription="Nothing was reported often enough in one barangay to count as recurring."
                  />
                </Section>
              </div>
            )}

            {tab === 'times' && (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <MetricCard
                    compact
                    label="Avg. repair time"
                    value={formatMinutes(summary.avgRepair)}
                    hint="First dispatch to completion"
                  >
                    <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
                  </MetricCard>
                  <MetricCard
                    compact
                    tone="amber"
                    label="Dispatched within limit"
                    value={summary.responsePct !== null ? `${summary.responsePct}%` : '—'}
                    hint={
                      summary.thresholdMinutes
                        ? `Response threshold ${summary.thresholdMinutes} min`
                        : 'No response threshold set'
                    }
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </MetricCard>
                  <MetricCard
                    compact
                    tone="green"
                    label="Resolved within target"
                    value={summary.resolutionPct !== null ? `${summary.resolutionPct}%` : '—'}
                    hint={
                      summary.targetMinutes
                        ? `Target ${formatMinutes(summary.targetMinutes)} · ${summary.resolutionCount} resolved`
                        : 'No resolution target set (Dispatch settings)'
                    }
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </MetricCard>
                </div>
                {/* StageBreakdown is already a card, so it is not wrapped in a Section */}
                <StageBreakdown averages={data.stageAverages} />
              </>
            )}

            {tab === 'linemen' && (
              <Section
                title="Lineman Performance"
                description="Resolved jobs on the reports above. Read each average together with its rating count."
              >
                <DataTable
                  columns={LINEMAN_COLUMNS}
                  isEmpty={data.linemen.length === 0}
                  empty="No lineman accounts yet."
                  footer={<Pagination {...linemanPg.paginationProps} />}
                >
                  {linemanPg.pageItems.map((l) => (
                    <tr key={l.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-5 py-4 text-center font-medium text-gray-900">
                        {l.name}
                        {!l.isActive && (
                          <span className="ml-2 text-xs font-semibold text-gray-400">Inactive</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center text-gray-600">{l.areaOffice || '—'}</td>
                      <td className="px-5 py-4 text-center text-gray-600">{l.jobsCompleted}</td>
                      <td className="px-5 py-4 text-center text-gray-600">{formatMinutes(l.avgRepair)}</td>
                      <td className="px-5 py-4 text-center text-gray-600">{formatDuration(l.avgTravel)}</td>
                      <td className="px-5 py-4 text-center text-gray-600">{formatDuration(l.avgOnSite)}</td>
                      <td className="px-5 py-4 text-center">
                        {l.ratingCount > 0 ? (
                          <span className="font-semibold text-gray-900">
                            <span className="text-amber-500">★</span> {l.ratingAverage.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No ratings</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center text-gray-600">{l.ratingCount}</td>
                    </tr>
                  ))}
                </DataTable>
              </Section>
            )}
          </div>
        </>
      )}
    </div>
  )
}