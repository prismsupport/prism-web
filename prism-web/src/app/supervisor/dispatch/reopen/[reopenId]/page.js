'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import TicketDetailHeader from '@/components/dispatch/TicketDetailHeader'
import TicketStatusPriority from '@/components/dispatch/TicketStatusPriority'
import PhotoEvidenceCard from '@/components/dispatch/PhotoEvidenceCard'
import AssignedLinemanCard from '@/components/dispatch/AssignedLinemanCard'
import JobOrderStatusLog from '@/components/dispatch/JobOrderStatusLog'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'
import { reopenAssignment } from '@/lib/dispatch/reopenAssignment'

export default function ReopenReviewPage() {
  const { reopenId } = useParams()
  const router = useRouter()

  const [reopen, setReopen] = useState(null)
  const [report, setReport] = useState(null)
  const [reporterName, setReporterName] = useState('')
  const [originalAssignment, setOriginalAssignment] = useState(null)
  const [assignedLinemanName, setAssignedLinemanName] = useState('')
  const [statusLogs, setStatusLogs] = useState([])
  const [qaReview, setQaReview] = useState(null)
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState(null)
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState(null)
  const [newPhotoUrl, setNewPhotoUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [reopenId])

  async function loadData() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: reopenData, error: reopenError } = await supabase
      .from('reopen_requests')
      .select('*')
      .eq('reopen_id', reopenId)
      .single()

    if (reopenError) {
      setError(reopenError.message)
      setLoading(false)
      return
    }
    setReopen(reopenData)

    const { data: reportData } = await supabase
      .rpc('get_report_with_location', { p_report_id: reopenData.report_id })
      .single()
    setReport(reportData)

    const { data: consumer } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', reopenData.consumer_id)
      .single()
    if (consumer) setReporterName(`${consumer.first_name} ${consumer.last_name}`)

    const { data: assignmentData } = await supabase
      .from('job_assignments')
      .select('*')
      .eq('report_id', reopenData.report_id)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setOriginalAssignment(assignmentData)

    if (assignmentData) {
      const { data: lineman } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', assignmentData.lineman_id)
        .single()
      if (lineman) setAssignedLinemanName(`${lineman.first_name} ${lineman.last_name}`)

      const { data: logs } = await supabase
        .from('job_assignment_status_logs')
        .select('*')
        .eq('assignment_id', assignmentData.assignment_id)
        .order('changed_at', { ascending: true })
      setStatusLogs(logs || [])

      const { data: review } = await supabase
        .from('qa_reviews')
        .select('*')
        .eq('assignment_id', assignmentData.assignment_id)
        .order('reviewed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setQaReview(review)

      if (assignmentData.photo_url) {
        const { data } = await supabase.storage
          .from('assignment-proofs')
          .createSignedUrl(assignmentData.photo_url, 3600)
        if (data) setCompletionPhotoUrl(data.signedUrl)
      }
    }

    if (reportData?.photo_url) {
      const { data } = await supabase.storage
        .from('report-photos')
        .createSignedUrl(reportData.photo_url, 3600)
      if (data) setOriginalPhotoUrl(data.signedUrl)
    }

    if (reopenData.photo_url) {
      const { data } = await supabase.storage
        .from('report-photos')
        .createSignedUrl(reopenData.photo_url, 3600)
      if (data) setNewPhotoUrl(data.signedUrl)
    }

    setLoading(false)
  }

  async function handleApprove() {
    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!originalAssignment) {
      setError('No original assignment found — cannot determine which lineman to re-notify.')
      setActionLoading(false)
      return
    }

    const { error: reopenErrorMsg } = await reopenAssignment({
      reportId: reopen.report_id,
      linemanId: originalAssignment.lineman_id,
    })

    if (reopenErrorMsg) {
      setError(reopenErrorMsg)
      setActionLoading(false)
      return
    }

    const { error: statusError } = await supabase
      .from('reopen_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('reopen_id', reopenId)

    if (statusError) {
      setError(statusError.message)
      setActionLoading(false)
      return
    }

    router.push('/supervisor/dispatch')
  }

  async function handleReject() {
    if (!reviewNote.trim()) {
      setError('Please provide a reason for rejecting this request.')
      return
    }
    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: reopenError } = await supabase
      .from('reopen_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote.trim(),
      })
      .eq('reopen_id', reopenId)

    if (reopenError) {
      setError(reopenError.message)
      setActionLoading(false)
      return
    }

    router.push('/supervisor/dispatch')
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  if (error && !reopen) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {error}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <ReportMap
          lat={report?.lat}
          lng={report?.lng}
          label={report?.nearest_landmark || report?.barangay}
        />
      </div>

      <div className="overflow-y-auto space-y-6">
        <BackToDispatchLink />

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <TicketDetailHeader
            ticketNumber={report?.ticket_number}
            reporterName={reporterName}
            reopened
          />
          <TicketStatusPriority status="pending" priority={report?.priority} />
          <p className="text-xs text-gray-400">
            Reopen requested{' '}
            {new Date(reopen.requested_at).toLocaleString('en-PH', {
              month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Original report */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">
            Original Report
          </p>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-400">Time Reported</p>
              <p className="text-gray-900">
                {new Date(report?.created_at).toLocaleString('en-PH', {
                  month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>
            </div>
            {originalAssignment?.completed_at && (
              <div>
                <p className="text-xs text-gray-400">Time Restored</p>
                <p className="text-gray-900">
                  {new Date(originalAssignment.completed_at).toLocaleString('en-PH', {
                    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Description</p>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mt-1">
                "{report?.report_details}"
              </p>
            </div>
          </div>
        </div>

        <PhotoEvidenceCard status="pending" photoUrl={originalPhotoUrl} />

        {qaReview && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">
              Original QA Review
            </p>
            <p className={`text-sm font-bold ${qaReview.decision === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
              {qaReview.decision === 'approved' ? '✓ Approved' : '✗ Rejected'}
            </p>
            {qaReview.remarks && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-2">
                {qaReview.remarks}
              </p>
            )}
          </div>
        )}

        <PhotoEvidenceCard status="fixed" photoUrl={completionPhotoUrl} />

        {/* New reopen request details */}
        <div className="bg-white rounded-xl border-2 border-amber-300 p-6">
          <p className="text-xs font-bold text-amber-700 uppercase mb-2">
            Reopen Request — New Details
          </p>
          <p className="text-xs text-gray-400 mb-2">
            Requested{' '}
            {new Date(reopen.requested_at).toLocaleString('en-PH', {
              month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </p>
          <p className="text-sm text-gray-700 bg-amber-50 rounded-lg p-3 mb-3">
            "{reopen.description}"
          </p>
          {newPhotoUrl ? (
            <img
              src={newPhotoUrl}
              alt="Reopen evidence"
              className="w-full rounded-lg border border-gray-200"
            />
          ) : (
            <p className="text-xs text-gray-400 italic">No new photo submitted.</p>
          )}
        </div>

        {originalAssignment && (
          <AssignedLinemanCard
            name={assignedLinemanName}
            assignedAt={originalAssignment.assigned_at}
          />
        )}

        <JobOrderStatusLog logs={statusLogs} />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!showRejectBox ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectBox(true)}
              disabled={actionLoading}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm py-3 rounded-lg border border-red-200"
            >
              Reject Request
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-lg"
            >
              {actionLoading ? 'Approving…' : 'Approve Reopen'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
              REASON FOR REJECTION
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              placeholder="Explain why this reopen request is being denied…"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg"
              >
                {actionLoading ? 'Submitting…' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => setShowRejectBox(false)}
                disabled={actionLoading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}