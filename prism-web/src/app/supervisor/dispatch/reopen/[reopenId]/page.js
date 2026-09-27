'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import TicketDetailHeader from '@/components/dispatch/TicketDetailHeader'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'
import { reopenAssignment } from '@/lib/dispatch/reopenAssignment'

function labelize(value) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function ReopenReviewPage() {
  const { reopenId } = useParams()
  const router = useRouter()

  const [reopen, setReopen] = useState(null)
  const [report, setReport] = useState(null)
  const [reporterName, setReporterName] = useState('')
  const [originalAssignment, setOriginalAssignment] = useState(null)
  const [allAttempts, setAllAttempts] = useState([])
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState(null)
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

    const { data: allAssignments } = await supabase
      .from('job_assignments')
      .select('*')
      .eq('report_id', reopenData.report_id)
      .order('assigned_at', { ascending: true })

    const assignmentList = allAssignments || []
    const latestAssignment = assignmentList[assignmentList.length - 1] || null
    setOriginalAssignment(latestAssignment)

    const linemanIds = Array.from(new Set(assignmentList.map((a) => a.lineman_id)))
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
    for (const [index, a] of assignmentList.entries()) {
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

      let photoUrl = null
      if (a.photo_url) {
        const { data: signed } = await supabase.storage
          .from('assignment-proofs')
          .createSignedUrl(a.photo_url, 3600)
        if (signed) photoUrl = signed.signedUrl
      }

      attempts.push({
        ...a,
        attemptNumber: index + 1,
        linemanName: linemenMap[a.lineman_id] || 'Unknown',
        logs: logs || [],
        review,
        photoUrl,
      })
    }
    setAllAttempts(attempts)

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
    <div>
      <BackToDispatchLink withMarginBottom />

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <TicketDetailHeader
          ticketNumber={report?.ticket_number}
          reporterName={reporterName}
          reopened
        />
        <p className="text-xs text-gray-400">
          Reopen requested{' '}
          {new Date(reopen.requested_at).toLocaleString('en-PH', {
            month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </p>
      </div>

      {/* Small map / Original / Reopen — three columns */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Map — narrow */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden h-64">
          <ReportMap
            lat={report?.lat}
            lng={report?.lng}
            label={report?.nearest_landmark || report?.barangay}
          />
        </div>

        {/* Original — center, includes full attempt history */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">
              Original Report
            </p>
            <p className="text-xs text-gray-400">
              Reported{' '}
              {new Date(report?.created_at).toLocaleString('en-PH', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-2">
              "{report?.report_details}"
            </p>
            {originalPhotoUrl ? (
              <img
                src={originalPhotoUrl}
                alt="Original evidence"
                className="w-full rounded-lg border border-gray-200 mt-2"
              />
            ) : (
              <p className="text-xs text-gray-400 italic mt-2">No original photo.</p>
            )}
          </div>

          {allAttempts.map((a) => (
            <div key={a.assignment_id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase">
                  Attempt {a.attemptNumber}
                </p>
                <span className="text-xs font-medium text-gray-400">
                  {a.linemanName}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Assigned{' '}
                {new Date(a.assigned_at).toLocaleString('en-PH', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>

              {a.logs.length > 0 && (
                <div className="space-y-1 mb-2">
                  {a.logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{labelize(log.new_status)}</span>
                      <span className="text-gray-400">
                        {new Date(log.changed_at).toLocaleString('en-PH', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {a.repair_note && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 mb-2">
                  {a.repair_note}
                </p>
              )}

              {a.photoUrl && (
                <img
                  src={a.photoUrl}
                  alt={`Attempt ${a.attemptNumber} completion`}
                  className="w-full rounded-lg border border-gray-200 mb-2"
                />
              )}

              {a.review && (
                <p className={`text-xs font-bold ${a.review.decision === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                  QA: {a.review.decision === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  {a.review.remarks && ` — ${a.review.remarks}`}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Reopen request — right */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-xl border-2 border-amber-300 p-5">
            <p className="text-xs font-bold text-amber-700 uppercase mb-2">
              Reopen Request — New Details
            </p>
            <p className="text-xs text-gray-400 mb-2">
              Requested{' '}
              {new Date(reopen.requested_at).toLocaleString('en-PH', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
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
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-6">
          {error}
        </p>
      )}

      {!showRejectBox ? (
        <div className="flex gap-3 mt-6 max-w-2xl">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6 max-w-2xl">
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
  )
}