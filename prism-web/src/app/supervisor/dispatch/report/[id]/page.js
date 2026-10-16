'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import LinemanRecommendationPanel from '@/components/ui/LinemanRecommendationPanel'
import QAReviewSection from '@/components/ui/QAReviewSection'
import TicketDetailHeader from '@/components/dispatch/TicketDetailHeader'
import TicketStatusPriority from '@/components/dispatch/TicketStatusPriority'
import AssignedLinemanCard from '@/components/dispatch/AssignedLinemanCard'
import JobOrderStatusLog from '@/components/dispatch/JobOrderStatusLog'
import PhotoDropdown from '@/components/dispatch/PhotoDropdown'
import ReporterInfo from '@/components/dispatch/ReporterInfo'
import DeclineReportModal from '@/components/dispatch/DeclineReportModal'
import LinemanDispatchedModal from '@/components/dispatch/LinemanDispatchedModal'
import ResolveTicketBar from '@/components/dispatch/ResolveTicketBar'
import AttemptReviewCard from '@/components/dispatch/AttemptReviewCard'
import { reopenAssignment } from '@/lib/dispatch/reopenAssignment'
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from '@/lib/toast'

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
  const [showHistory, setShowHistory] = useState(false)

  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [linemen, setLinemen] = useState([])
  const [linemenLoading, setLinemenLoading] = useState(false)
  const [linemenError, setLinemenError] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [dispatchedInfo, setDispatchedInfo] = useState(null)
  const [linemanDetailsOpen, setLinemanDetailsOpen] = useState(false)

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

    // Build full history for every prior attempt (before the current/latest
    // assignment) so a reopened or QA-rejected report keeps its complete
    // trail visible here, not just on the separate Reopen Review page.
    if (assignmentList.length > 1) {
      const priorAssignments = assignmentList.slice(0, -1)

      const linemanIds = Array.from(new Set(priorAssignments.map((a) => a.lineman_id)))
      let linemenMap = {}
      if (linemanIds.length > 0) {
        const { data } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', linemanIds)
        ;(data || []).forEach((u) => {
          linemenMap[u.id] = `${u.first_name} ${u.last_name}`
        })
      }

      const attempts = []
      for (const [index, a] of priorAssignments.entries()) {
        const { data: logs } = await supabase
          .from('job_assignment_status_logs')
          .select('*')
          .eq('assignment_id', a.assignment_id)
          .order('changed_at', { ascending: true })

        const { data: review } = await supabase
          .from('qa_reviews')
          .select('*')
          .eq('assignment_id', a.assignment_id)
          .order('reviewed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let attemptPhotoUrl = null
        if (a.photo_url) {
          const { data: signedAttempt } = await supabase.storage
            .from('assignment-proofs')
            .createSignedUrl(a.photo_url, 3600)
          if (signedAttempt) attemptPhotoUrl = signedAttempt.signedUrl
        }

        attempts.push({
          ...a,
          attemptNumber: index + 1,
          linemanName: linemenMap[a.lineman_id] || 'Unknown',
          logs: logs || [],
          review,
          photoUrl: attemptPhotoUrl,
        })
      }
      setPastAttempts(attempts)
    } else {
      setPastAttempts([])
    }

    setLoading(false)
  }

  async function handleOpenAssignPanel() {
    setShowAssignPanel(true)
    setLinemenLoading(true)
    setLinemenError('')
    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('get_lineman_recommendations', {
      p_report_id: id,
    })
    if (rpcError) setLinemenError(rpcError.message)
    setLinemen(data || [])
    setLinemenLoading(false)
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
    setAssigning(true)
    setLinemenError('')
    const supabase = createClient()

    const { error: assignError } = await supabase.from('job_assignments').insert({
      report_id: id,
      lineman_id: linemanId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    })

    if (assignError) {
      toast.error(assignError.message)
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

  async function handleReopen() {
    setActionLoading(true)
    const { error: reopenError } = await reopenAssignment({
      reportId: id,
      linemanId: assignment.lineman_id,
    })

    if (reopenError) {
      toast.error(reopenError)
      setError(reopenError)
      setActionLoading(false)
      return
    }

    setActionLoading(false)
    toast.success('Assignment reopened')
    loadReport()
  }

  if (loading) return <PageLoading />

  if (!report) {
    return <p className="text-sm text-red-600">{error || 'Report not found.'}</p>
  }

  const isPending = report.status === 'pending' && !assignment
  const currentStatus = assignment ? assignment.status : report.status

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <ReportMap
          lat={report.lat}
          lng={report.lng}
          label={report.nearest_landmark || report.barangay}
        />
      </div>

      {showAssignPanel ? (
        <LinemanRecommendationPanel
          linemen={linemen}
          loading={linemenLoading}
          error={linemenError}
          priority={report.priority}
          onPriorityChange={handlePriorityChange}
          onAssign={handleAssignLineman}
          onBack={() => setShowAssignPanel(false)}
          assigning={assigning}
        />
      ) : (
        <div className="overflow-y-auto space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <TicketDetailHeader
              ticketNumber={report.ticket_number}
              reporterName={reporterName}
              reopened={!!report.reopened_at}
              onClose={() => router.push('/supervisor/dispatch')}
            />

            <TicketStatusPriority status={currentStatus} priority={report.priority} />

            <ReporterInfo reportId={report.report_id} consumerId={report.consumer_id} />

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Time Reported</p>
                <p className="text-gray-900">
                  {new Date(report.created_at).toLocaleString('en-PH', {
                    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              </div>
              {assignment?.completed_at && (
                <div>
                  <p className="text-xs text-gray-400">Time Restored</p>
                  <p className="text-gray-900">
                    {new Date(assignment.completed_at).toLocaleString('en-PH', {
                      month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-gray-900 font-medium">
                  {report.nearest_landmark || `${report.barangay}, ${report.municipality}`}
                </p>
                <p className="text-gray-500 text-xs">
                  Zone {report.zone || '—'}, {report.barangay}, {report.municipality}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Description</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mt-1">
                  "{report.report_details}"
                </p>
              </div>
              {report.other_homes_affected && (
                <p className="text-xs text-amber-600 font-medium">
                  ⚠ Consumer indicated nearby households are also affected
                </p>
              )}
              <PhotoDropdown label="Photo Evidence" photoUrl={photoSignedUrl} />
            </div>
          </div>

          {report.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-sm font-bold text-red-700 mb-2">Report Declined</h2>
              <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-red-100">
                {report.decline_reason || 'No reason provided.'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Declined:{' '}
                {new Date(report.updated_at).toLocaleString('en-PH', {
                  month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {assignment && (
            <AssignedLinemanCard
              name={assignedLinemanName}
              assignedAt={assignment.assigned_at}
              expandable
              expanded={linemanDetailsOpen}
              onToggleExpand={() => setLinemanDetailsOpen(!linemanDetailsOpen)}
            >
              {(assignment.status === 'fixed' || assignment.status === 'resolved') && (
                <QAReviewSection assignment={assignment} reportId={id} onReviewed={loadReport} />
              )}
              <JobOrderStatusLog logs={statusLogs} />
            </AssignedLinemanCard>
          )}

          {pastAttempts.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="group flex items-center justify-between w-full bg-white rounded-xl border border-gray-200 px-5 py-4 text-xs font-bold text-gray-900 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <span>Job Order History ({pastAttempts.length})</span>
                <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm whitespace-nowrap group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
                  {showHistory ? 'Hide ▲' : 'View ▾'}
                </span>
              </button>
              {showHistory && (
                <div className="mt-4 space-y-4">
                  {pastAttempts.map((a) => (
                    <AttemptReviewCard key={a.assignment_id} attempt={a} />
                  ))}
                </div>
              )}
            </div>
          )}

          {isPending && (
            <div className="space-y-3">
              <button
                onClick={handleOpenAssignPanel}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
              >
                Assign Lineman
              </button>
              <button
                onClick={() => setShowDeclineModal(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
              >
                Decline Report
              </button>
            </div>
          )}

          <ResolveTicketBar status={assignment?.status} onReopen={handleReopen} loading={actionLoading} />
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