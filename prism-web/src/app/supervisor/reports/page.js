'use client'

import { useEffect, useState } from 'react'
import usePagination from '@/lib/usePagination'
import { toast } from '@/lib/toast'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import { PageLoading } from '@/components/ui/Skeleton'
import SegmentedControl from '@/components/ui/SegmentedControl'
import ExportMenu from '@/components/reports/ExportMenu'
import ReportFilterBar from '@/components/reports/ReportFilterBar'
import ReportSummaryCards from '@/components/reports/ReportSummaryCards'
import OverviewTab from '@/components/reports/tabs/OverviewTab'
import LocationsTab from '@/components/reports/tabs/LocationsTab'
import TimesTab from '@/components/reports/tabs/TimesTab'
import LinemenTab from '@/components/reports/tabs/LinemenTab'
import useCooperativeProfile from '@/lib/supervisor/useCooperativeProfile'
import { loadLogoImage } from '@/lib/reports/loadLogoImage'
import { exportReportToExcel } from '@/lib/reports/exportExcel'
import { exportReportToPdf } from '@/lib/reports/exportPdf'
import { usePermissions } from '@/lib/supervisor/PermissionsContext'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import { TABS } from '@/lib/reports/constants'
import { buildReportFilters } from '@/lib/reports/filterOptions'
import { buildPeriodLabel, buildExportMeta } from '@/lib/reports/exportMeta'
import { useReportsData } from '@/lib/reports/useReportsData'

export default function ReportsPage() {
  const [exporting, setExporting] = useState(false)
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
  const { isOwner } = usePermissions()
  const { statusLabel, priorityLevels } = useStatusLabels()

  const { options, supervisorName, data, loading, refreshing, from, to, dateError } = useReportsData({
    rangeKey,
    customFrom,
    customTo,
    municipality,
    barangay,
    feeder,
    areaOffice,
    category,
    priority,
    status,
    compare,
  })

  const linemanPg = usePagination(data?.linemen || [])

  useEffect(() => {
    linemanPg.setPage(1)
  }, [data])

  const filters = buildReportFilters({
    values: { municipality, barangay, feeder, areaOffice, category, priority, status },
    setters: {
      setMunicipality,
      setBarangay,
      setFeeder,
      setAreaOffice,
      setCategory,
      setPriority,
      setStatus,
    },
    options,
    priorityLevels,
    statusLabel,
  })

  async function handleExport(kind) {
    if (!data || exporting) return
    setExporting(true)
    try {
      const periodLabel = buildPeriodLabel({ rangeKey, customFrom, customTo, from, to })

      const logo = kind === 'pdf' ? await loadLogoImage(logoUrl) : null // { dataUrl, width, height } or null

      const meta = buildExportMeta({
        coopName,
        logo,
        supervisorName,
        isOwner,
        statusLabel,
        periodLabel,
        filters,
      })

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
          <ExportMenu
            onExport={handleExport}
            disabled={!data || refreshing || exporting}
            exporting={exporting}
          />
        }
        description="Outage frequency, issue categories, locations, response and resolution times, recurring incidents, and lineman performance for the period and area you choose."
      />

      <ReportFilterBar
        rangeKey={rangeKey}
        onRangeChange={setRangeKey}
        refreshing={refreshing}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
        compare={compare}
        onCompareChange={setCompare}
        filters={filters}
      />

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

      {summary && <ReportSummaryCards summary={summary} cmp={cmp} refreshing={refreshing} />}

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
              <OverviewTab
                data={data}
                summary={summary}
                cmp={cmp}
                priorityLevels={priorityLevels}
                statusLabel={statusLabel}
              />
            )}

            {tab === 'locations' && <LocationsTab data={data} summary={summary} />}

            {tab === 'times' && <TimesTab summary={summary} stageAverages={data.stageAverages} />}

            {tab === 'linemen' && <LinemenTab linemen={data.linemen} pagination={linemanPg} />}
          </div>
        </>
      )}
    </div>
  )
}