
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recurringSinceIso } from '@/lib/recurring'
import { reopenAssignment } from '@/lib/dispatch/reopenAssignment'
import { loadJobAttempts } from '@/lib/dispatch/loadJobAttempts'
import { transferAssignment } from '@/lib/dispatch/transferAssignment'
import { loadShiftInfo } from '@/lib/lineman/shiftInfo'
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from '@/lib/toast'
import TicketTabs, { TabDot } from '@/components/dispatch/TicketTabs'
import Alert from '@/components/ui/Alert'
import ReportMap from '@/components/ui/ReportMap'
import LinemanRecommendationPanel from '@/components/ui/LinemanRecommendationPanel'
import DeclineReportModal from '@/components/dispatch/DeclineReportModal'
import LinemanDispatchedModal from '@/components/dispatch/LinemanDispatchedModal'
import ReopenTicketModal from '@/components/dispatch/ReopenTicketModal'
import ReopenReasonNote from '@/components/dispatch/ReopenReasonNote'
import ReportDetailsTab from '@/components/dispatch/report/ReportDetailsTab'
import ReportJobTab from '@/components/dispatch/report/ReportJobTab'
import ReportHistoryTab from '@/components/dispatch/report/ReportHistoryTab'
import ReportActionBar from '@/components/dispatch/report/ReportActionBar'

export default function ReportReviewPage() {
  const { id } = useParams()
  const router = useRouter()

  const [report, setReport] = useState(null)
  const [reporterName, setReporterName] = useState('')
  const [assignment, setAssignment] = useState(null)
  const [assignedLinemanName, setAssignedLinemanName] = useState('')
  const [statusLogs, setStatusLogs] = useState([])
  const [pastAttempts, setPastAttempts] = useState([])
  const [photoSignedUrl, setPhotoSignedUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMap, setShowMap] = useState(true)
  const [issueCode, setIssueCode] = useState(null)
  const [proofLocation, setProofLocation] = useState(null)
  const [videoPath, setVideoPath] = useState(null)
  const [recurringCount, setRecurringCount] = useState(0)

  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [panelMode, setPanelMode] = useState('assign') // 'assign' | 'transfer'
  const [shiftInfo, setShiftInfo] = useState({})
  const [linemen, setLinemen] = useState([])
  const [linemenLoading, setLinemenLoading] = useState(false)
  const [linemenError, setLinemenError] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [dispatchedInfo, setDispatchedInfo] = useState(null)
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [linemanDetailsOpen, setLinemanDetailsOpen] = useState(true)
  const [tab, setTab] = useState(null)

  useEffect(() => {
    loadReport()
  }, [id])

  async function loadReport() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: reportData, error: reportError } = await supabase
      .rpc('get_report_with_location', { p_report_id: id })
      .single()

    if (reportError) {
      setError(reportError.message)
      setLoading(false)
      return
    }

    setReport(reportData)

    const { data: catRow } = await supabase
      .from('reports')
      .select('issue_code, proof_location_consistent, video_url')
      .eq('report_id', id)
      .maybeSingle()
    const code = catRow?.issue_code || null
    setIssueCode(code)
    setProofLocation(catRow?.proof_location_consistent ?? null)
    setVideoPath(catRow?.video_url || null)

    setRecurringCount(0)
    if (code && code !== 'other') {
      const { count } = await supabase
        .from('reports')
        .select('report_id', { count: 'exact', head: true })
        .eq('issue_code', code)
        .eq('barangay', reportData.barangay)
        .eq('municipality', reportData.municipality)
        .neq('status', 'cancelled')
        .gte('created_at', recurringSinceIso())
      setRecurringCount(count ?? 0)
    }

    if (reportData.photo_url) {
      const { data: signed } = await supabase.storage
        .from('report-photos')
        .createSignedUrl(reportData.photo_url, 3600)
      if (signed) setPhotoSignedUrl(signed.signedUrl)
    }

    const { data: consumer } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', reportData.consumer_id)
      .single()

    if (consumer) {
      setReporterName(`${consumer.first_name} ${consumer.last_name}`)
    }

    const { data: allAssignments } = await supabase
      .from('job_assignments')
      .select('*')
      .eq('report_id', id)
      .order('assigned_at', { ascending: true })

    const assignmentList = allAssignments || []
    const latestAssignment = assignmentList[assignmentList.length - 1] || null
    setAssignment(latestAssignment)

    if (latestAssignment) {
      const { data: lineman } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', latestAssignment.lineman_id)
        .single()
      if (lineman) {
        setAssignedLinemanName(`${lineman.first_name} ${lineman.last_name}`)
      }

      const { data: logs } = await supabase
        .from('job_assignment_status_logs')
        .select('*')
        .eq('assignment_id', latestAssignment.assignment_id)
        .order('changed_at', { ascending: true })
      setStatusLogs(logs || [])
    }

    // Full history of every attempt, so a reopened or QA-rejected report keeps
    // its complete trail visible here, not just on the Reopen Review page.
    if (assignmentList.length > 1) {
      setPastAttempts(await loadJobAttempts(supabase, assignmentList))
    } else {
      setPastAttempts([])
    }

    setLoading(false)
  }

  async function handleOpenAssignPanel(mode = 'assign') {
    setPanelMode(mode)
    setShowAssignPanel(true)
    setLinemenLoading(true)
    setLinemenError('')
    const supabase = createClient()
    const [{ data, error: rpcError }, shifts] = await Promise.all([
      supabase.rpc('get_lineman_recommendations', { p_report_id: id }),
      loadShiftInfo(supabase),
    ])
    if (rpcError) setLinemenError(rpcError.message)
    setLinemen(data || [])
    setShiftInfo(shifts)
    setLinemenLoading(false)
  }

  async function handleTransferLineman(linemanId, reason) {
    setAssigning(true)
    setLinemenError('')
    const { error: transferError } = await transferAssignment({
      assignmentId: assignment.assignment_id,
      newLinemanId: linemanId,
      reason,
    })
    setAssigning(false)
    if (transferError) {
      toast.error(transferError)
      setLinemenError(transferError)
      return
    }
    toast.success('Job order transferred')
    setShowAssignPanel(false)
    loadReport()
  }

  async function handlePriorityChange(newPriority) {
    const supabase = createClient()
    const { error } = await supabase.from('reports').update({ priority: newPriority }).eq('report_id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    setReport((prev) => ({ ...prev, priority: newPriority }))
    toast.success('Priority updated')
  }

  async function handleAssignLineman(linemanId) {
    if (!report.priority) {
      toast.error('Set a priority before assigning a lineman')
      return
    }

    setAssigning(true)
    setLinemenError('')
    const supabase = createClient()

    const { error: assignError } = await supabase.rpc('assign_lineman', {
      p_report_id: id,
      p_master_id: null,
      p_lineman_id: linemanId,
    })

    if (assignError) {
      toast.error(assignError)
      setLinemenError(assignError.message)
      setAssigning(false)
      return
    }

    const { error: reportError } = await supabase
      .from('reports')
      .update({ status: 'dispatched' })
      .eq('report_id', id)

    if (reportError) {
      toast.error(reportError.message)
      setLinemenError(reportError.message)
      setAssigning(false)
      return
    }

    const pickedLineman = linemen.find((l) => l.id === linemanId || l.lineman_id === linemanId)

    setDispatchedInfo({
      linemanName: pickedLineman
        ? `${pickedLineman.first_name} ${pickedLineman.last_name}`
        : 'Assigned',
      ticketNumber: report.ticket_number,
      location: report.nearest_landmark || report.barangay,
      barangay: `Zone ${report.zone || '—'}, ${report.barangay}`,
      priority: report.priority,
    })
    setAssigning(false)
    setShowAssignPanel(false)
    toast.success('Lineman assigned')
  }

  async function handleConfirmDecline(reason) {
    setActionLoading(true)
    setError('')
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'cancelled', decline_reason: reason })
      .eq('report_id', id)

    if (updateError) {
      toast.error(updateError.message)
      setError(updateError.message)
      setActionLoading(false)
      return
    }

    toast.success('Report declined')
    router.push('/supervisor/dispatch')
  }

  // Called by the Re-open dialog. Returns an error message, or null on success.
  async function handleReopen(reason, linemanId) {
    const { error: reopenError } = await reopenAssignment({
      reportId: id,
      linemanId: linemanId || assignment.lineman_id,
      reason,
      source: 'supervisor',
    })

    if (reopenError) return reopenError

    setShowReopenModal(false)
    toast.success('Ticket reopened')
    loadReport()
    return null
  }

  if (loading) return <PageLoading />

  if (!report) {
    return <p className="text-sm text-red-600">{error || 'Report not found.'}</p>
  }

  const isPending = report.status === 'pending' && !assignment
  const currentStatus = assignment ? assignment.status : report.status
  const activeTab = tab ?? (assignment?.status === 'fixed' ? 'job' : 'details')
  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'job', label: <>Job Order<TabDot show={assignment?.status === 'fixed'} /></> },
    { key: 'history', label: <>Time &amp; History{pastAttempts.length > 0 ? ` (${pastAttempts.length})` : ''}</> },
  ]
  const compactLayout = !showMap

  return (
    <div
      className={`grid grid-cols-1 ${
        showMap ? 'lg:grid-cols-2' : ''
      } gap-6 lg:h-[calc(100vh-8rem)]`}
    >
      {showMap && (
        <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[18rem]">
          <ReportMap
            lat={report.lat}
            lng={report.lng}
            priority={report.priority ?? null}
            label={report.nearest_landmark || report.barangay}
          />
          <button
            type="button"
            onClick={() => setShowMap(false)}
            className="absolute top-4 right-4 z-[500] text-sm text-blue-700 font-medium bg-white border border-blue-200 rounded-lg px-3 py-1.5 shadow-sm hover:bg-blue-50 whitespace-nowrap"
          >
            Collapse Map
          </button>
        </div>
      )}

      {showAssignPanel ? (
        <LinemanRecommendationPanel
          linemen={linemen}
          loading={linemenLoading}
          error={linemenError}
          priority={report.priority}
          onPriorityChange={handlePriorityChange}
          onAssign={panelMode === 'transfer' ? handleTransferLineman : handleAssignLineman}
          title={panelMode === 'transfer' ? 'Transfer Job Order' : 'Smart Dispatch Recommendation'}
          assignLabel={panelMode === 'transfer' ? 'Transfer to Selected Lineman' : 'Assign Selected Lineman'}
          excludeLinemanId={panelMode === 'transfer' ? assignment?.lineman_id : null}
          requireReason={panelMode === 'transfer'}
          shiftInfo={shiftInfo}
          onBack={() => setShowAssignPanel(false)}
          assigning={assigning}
          compact={!showMap}
        />
      ) : (
        <div className="overflow-y-auto space-y-4">
          <Alert className="">{error}</Alert>
          {assignment?.reopen_reason && (
            <ReopenReasonNote source={assignment.reopen_source} reason={assignment.reopen_reason} />
          )}
          <TicketTabs
            tabs={tabs}
            value={activeTab}
            onChange={setTab}
            onClose={() => router.push('/supervisor/dispatch')}
          />

          {activeTab === 'details' && (
            <ReportDetailsTab
              report={report}
              reporterName={reporterName}
              assignment={assignment}
              currentStatus={currentStatus}
              issueCode={issueCode}
              proofLocation={proofLocation}
              videoPath={videoPath}
              photoSignedUrl={photoSignedUrl}
              recurringCount={recurringCount}
              showMap={showMap}
              onShowMap={() => setShowMap(true)}
              compactLayout={compactLayout}
            />
          )}

          {activeTab === 'job' && (
            <ReportJobTab
              reportId={id}
              assignment={assignment}
              assignedLinemanName={assignedLinemanName}
              statusLogs={statusLogs}
              issueCode={issueCode}
              proofLocation={proofLocation}
              linemanDetailsOpen={linemanDetailsOpen}
              onToggleLinemanDetails={() => setLinemanDetailsOpen(!linemanDetailsOpen)}
              onReviewed={loadReport}
              compactLayout={compactLayout}
            />
          )}

          {activeTab === 'history' && (
            <ReportHistoryTab
              reportId={id}
              assignmentStatus={assignment?.status}
              pastAttempts={pastAttempts}
              compactLayout={compactLayout}
            />
          )}

          <ReportActionBar
            isPending={isPending}
            assignmentStatus={assignment?.status}
            actionLoading={actionLoading}
            onAssign={() => handleOpenAssignPanel('assign')}
            canTransfer={!!assignment && ['assigned', 'on_the_way', 'arrived_at_site', 'in_progress'].includes(assignment.status)}
            onTransfer={() => handleOpenAssignPanel('transfer')}
            onDecline={() => setShowDeclineModal(true)}
            onReopen={() => setShowReopenModal(true)}
          />
        </div>
      )}

      {showDeclineModal && (
        <DeclineReportModal
          reporterName={reporterName}
          ticketNumber={report.ticket_number}
          onConfirm={handleConfirmDecline}
          onCancel={() => setShowDeclineModal(false)}
          loading={actionLoading}
        />
      )}

      {showReopenModal && (
        <ReopenTicketModal
          ticketLabel={report.ticket_number}
          originalLinemanId={assignment?.lineman_id}
          onConfirm={handleReopen}
          onClose={() => setShowReopenModal(false)}
        />
      )}

      {dispatchedInfo && (
        <LinemanDispatchedModal
          linemanName={dispatchedInfo.linemanName}
          ticketNumber={dispatchedInfo.ticketNumber}
          location={dispatchedInfo.location}
          barangay={dispatchedInfo.barangay}
          priority={dispatchedInfo.priority}
        />
      )}
    </div>
  )
}
