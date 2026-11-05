'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { loadReportData, loadFilterOptions } from '@/lib/reports/loadReportData'
import { formatMinutes } from '@/lib/performance'
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
import ReportTrendChart from '@/components/reports/ReportTrendChart'
import Button from '@/components/ui/Button'
import { exportReportToExcel } from '@/lib/reports/exportExcel'
import { exportReportToPdf } from '@/lib/reports/exportPdf'
import { formatDuration } from '@/lib/stageTimes'
import { RECURRING_MIN_REPORTS } from '@/lib/recurring'

const RANGES = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
  { key: 'custom', label: 'Custom' },
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

function Section({ title, description, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {description && <p className="mb-4 mt-1 text-xs text-gray-400">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </section>
  )
}

export default function ReportsPage() {
  const [coopId, setCoopId] = useState(null)
  const [options, setOptions] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [coopName, setCoopName] = useState('')

  const [rangeKey, setRangeKey] = useState('30')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [municipality, setMunicipality] = useState('all')
  const [barangay, setBarangay] = useState('all')
  const [feeder, setFeeder] = useState('all')
  const [areaOffice, setAreaOffice] = useState('all')

  const latestLoad = useRef(0)

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
      const { data: coop } = await supabase
        .from('cooperatives')
        .select('cooperative_name')
        .eq('id', id)
        .maybeSingle()
      setCoopName(coop?.cooperative_name || '')
    }
    init()
  }, [])

  // Reload whenever a filter changes
  useEffect(() => {
    if (!coopId || dateError) return
    const loadId = ++latestLoad.current
    setRefreshing(true)

    loadReportData(createClient(), coopId, { from, to, municipality, barangay, feeder, areaOffice })
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
  }, [coopId, rangeKey, customFrom, customTo, municipality, barangay, feeder, areaOffice])

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

      const meta = {
        cooperativeName: coopName,
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

      <FilterBar className="flex flex-wrap items-center gap-3">
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

        <div className="ml-auto">
          <FilterMenu filters={filters} label="Location" />
        </div>
        <FilterChips filters={filters} />
      </FilterBar>

      <Alert>{dateError}</Alert>

      {data?.truncated && (
        <p className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This period has more than 20,000 records, so the figures cover the most recent ones.
          Choose a shorter period for exact numbers.
        </p>
      )}

      {summary && (
        <div
          className={`grid grid-cols-2 gap-4 md:grid-cols-4 transition-opacity ${
            refreshing ? 'opacity-60' : ''
          }`}
        >
          <MetricCard
            label="Total outage reports"
            value={summary.totalReports}
            hint={summary.declinedReports > 0 ? `${summary.declinedReports} declined` : undefined}
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect width="8" height="4" x="8" y="2" rx="1" />
          </MetricCard>
          <MetricCard tone="green" label="Reports resolved" value={summary.resolvedReports}>
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </MetricCard>
          <MetricCard
            tone="amber"
            label="Avg. response time"
            value={formatMinutes(summary.avgResponse)}
            hint="Submission to first dispatch"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </MetricCard>
          <MetricCard
            label="Avg. resolution time"
            value={formatMinutes(summary.avgResolution)}
            hint="Submission to final completion"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </MetricCard>
        </div>
      )}

      {data && (
        <div className={`mt-6 space-y-6 transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
          <Section
            title="Outage Frequency"
            description="Reports filed over the selected period."
          >
            <ReportTrendChart data={data.trend} unit={data.trendUnit} />
          </Section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section
              title="Issue Categories"
              description="Category chosen by the consumer. Older reports show as Uncategorized."
            >
              <BarList
                rows={data.issues}
                emptyTitle="No reports in this period"
                emptyDescription="Try a wider date range or fewer location filters."
              />
            </Section>

            <AreaBreakdown breakdown={data.locations} />
          </div>

          <Section
            title="Response and Resolution Times"
            description="Response is submission to first dispatch. Repair is first dispatch to completion."
          >
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard label="Avg. repair time" value={formatMinutes(summary.avgRepair)} hint="First dispatch to completion">
                <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
              </MetricCard>
              <MetricCard
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
            <StageBreakdown averages={data.stageAverages} />
          </Section>

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

          <Section
            title="Lineman Performance"
            description="Resolved jobs on the reports above. Read each average together with its rating count."
          >
            <DataTable
              columns={LINEMAN_COLUMNS}
              isEmpty={data.linemen.length === 0}
              empty="No lineman accounts yet."
            >
              {data.linemen.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-4 text-center font-medium text-gray-900">
                    {l.name}
                    {!l.isActive && <span className="ml-2 text-xs font-semibold text-gray-400">Inactive</span>}
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
        </div>
      )}
    </div>
  )
}