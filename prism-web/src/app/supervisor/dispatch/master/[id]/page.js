'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import ReporterInfo from '@/components/dispatch/ReporterInfo'
import LinemanRecommendationPanel from '@/components/ui/LinemanRecommendationPanel'
import QAReviewSection from '@/components/ui/QAReviewSection'
import TicketDetailHeader from '@/components/dispatch/TicketDetailHeader'
import TicketStatusPriority from '@/components/dispatch/TicketStatusPriority'
import AssignedLinemanCard from '@/components/dispatch/AssignedLinemanCard'
import JobOrderStatusLog from '@/components/dispatch/JobOrderStatusLog'
import AttemptReviewCard from '@/components/dispatch/AttemptReviewCard'
import LinemanDispatchedModal from '@/components/dispatch/LinemanDispatchedModal'
import ResolveTicketBar from '@/components/dispatch/ResolveTicketBar'
import { reopenAssignment } from '@/lib/dispatch/reopenAssignment'
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from '@/lib/toast'

export default function MasterTicketDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [master, setMaster] = useState(null)
  const [members, setMembers] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [assignedLinemanName, setAssignedLinemanName] = useState('')
  const [statusLogs, setStatusLogs] = useState([])
  const [pastAttempts, setPastAttempts] = useState([])
  const [cooperativeId, setCooperativeId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [linemen, setLinemen] = useState([])
  const [linemenLoading, setLinemenLoading] = useState(false)
  const [linemenError, setLinemenError] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [dispatchedInfo, setDispatchedInfo] = useState(null)
  const [linemanDetailsOpen, setLinemanDetailsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadMaster()
  }, [id])

  async function loadMaster() {
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

    const { data: masterData, error: masterError } = await supabase
      .from('master_tickets')
      .select('*')
      .eq('master_id', id)
      .single()

    if (masterError) {
      setError(masterError.message)
      setLoading(false)
      return
    }

    const { data: geo } = await supabase
      .rpc('get_master_ticket_with_location', { p_master_id: id })
      .single()

    setMaster({ ...masterData, _lat: geo?.lat, _lng: geo?.lng })

    const { data: memberReportIds } = await supabase
      .from('reports')
      .select('report_id')
      .eq('master_id', id)

    const ids = (memberReportIds || []).map((r) => r.report_id)
    let memberReports = []
    if (ids.length > 0) {
      const { data } = await supabase.rpc('get_reports_with_location', {
        p_report_ids: ids,
      })
      memberReports = data || []
    }

    const consumerIds = (memberReports || []).map((r) => r.consumer_id)
    let consumerNames = []
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', consumerIds)
      consumerNames = data || []
    }

    setMembers(
      (memberReports || []).map((r) => ({
        ...r,
        reporterName: consumerNames.find((c) => c.id === r.consumer_id),
      }))
    )

    const { data: allAssignments } = await supabase
      .from('job_assignments')
      .select('*')
      .eq('master_id', id)
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

    // Same "prior attempts" history pattern as the Report detail page and the
    // Reopen Review page, so a reopened/QA-rejected master ticket keeps its
    // full job order history visible here too.
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
    const { data, error: rpcError } = await supabase.rpc(
  'get_lineman_recommendations_by_location',
  {
    p_lat: master._lat,
    p_lng: master._lng,
    p_cooperative_id: cooperativeId,
    p_barangay: master.barangay,
    p_municipality: master.municipality,
  }
)
    if (rpcError) setLinemenError(rpcError.message)
    setLinemen(data || [])
    setLinemenLoading(false)
  }

  async function handlePriorityChange(newPriority) {
    const supabase = createClient()
    const { error } = await supabase
      .from('master_tickets')
      .update({ priority: newPriority })
      .eq('master_id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    setMaster((prev) => ({ ...prev, priority: newPriority }))
    toast.success('Priority updated')
  }

  async function handleAssignLineman(linemanId) {
    setAssigning(true)
    setLinemenError('')
    const supabase = createClient()

    const { error: assignError } = await supabase.from('job_assignments').insert({
      master_id: id,
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

    const { error: masterError } = await supabase
      .from('master_tickets')
      .update({ status: 'dispatched' })
      .eq('master_id', id)

    if (masterError) {
      toast.error(masterError.message)
      setLinemenError(masterError.message)
      setAssigning(false)
      return
    }

    const pickedLineman = linemen.find((l) => l.id === linemanId || l.lineman_id === linemanId)

    setDispatchedInfo({
      linemanName: pickedLineman
        ? `${pickedLineman.first_name} ${pickedLineman.last_name}`
        : 'Assigned',
      ticketNumber: master.master_ticket,
      location: master.barangay,
      barangay: master.municipality,
      priority: master.priority,
    })
    setAssigning(false)
    setShowAssignPanel(false)
    toast.success('Lineman assigned')
  }

  async function handleReopen() {
    setActionLoading(true)
    const { error: reopenError } = await reopenAssignment({
      masterId: id,
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
    loadMaster()
  }

  if (loading) return <PageLoading />

  if (error || !master) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {error || 'Master ticket not found.'}
      </p>
    )
  }

  const currentStatus = assignment ? assignment.status : master.status

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[1000] bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg">
          ● ACTIVE INCIDENT
        </div>
        <ReportMap
          markers={members.map((m) => ({
            lat: m.lat,
            lng: m.lng,
            label: `${m.reporterName?.first_name || ''} ${m.reporterName?.last_name || ''} — ${m.ticket_number}`,
          }))}
        />
      </div>

      {showAssignPanel ? (
        <LinemanRecommendationPanel
          linemen={linemen}
          loading={linemenLoading}
          error={linemenError}
          priority={master.priority}
          onPriorityChange={handlePriorityChange}
          onAssign={handleAssignLineman}
          onBack={() => setShowAssignPanel(false)}
          assigning={assigning}
        />
      ) : (
        <div className="overflow-y-auto space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <TicketDetailHeader
              ticketNumber={master.master_ticket}
              reopened={!!master.reopened_at}
              onClose={() => router.push('/supervisor/dispatch')}
            />

            <TicketStatusPriority status={currentStatus} priority={master.priority} />

            <div className="text-sm">
              <p className="text-xs text-gray-400">Location</p>
              <p className="text-gray-900 font-medium">
                {master.barangay}, {master.municipality}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Affected Consumers</h2>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                TOTAL: {members.length}
              </span>
            </div>
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.report_id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {m.reporterName?.first_name} {m.reporterName?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Zone {m.zone || '—'}, {m.barangay}, {m.municipality}
                    </p>
                    <ReporterInfo compact reportId={m.report_id} consumerId={m.consumer_id} />
                  </div>
                  <span className="text-xs font-medium text-blue-700">
                    {m.ticket_number}
                  </span>
                </div>
              ))}
            </div>
          </div>

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
                <QAReviewSection assignment={assignment} masterId={id} onReviewed={loadMaster} />
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

          {!assignment && (
            <button
              onClick={handleOpenAssignPanel}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
            >
              Assign Lineman
            </button>
          )}

          <ResolveTicketBar status={assignment?.status} onReopen={handleReopen} loading={actionLoading} />
        </div>
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