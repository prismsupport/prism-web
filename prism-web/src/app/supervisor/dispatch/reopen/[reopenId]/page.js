'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ReopenReviewPage() {
  const { reopenId } = useParams()
  const router = useRouter()

  const [reopen, setReopen] = useState(null)
  const [report, setReport] = useState(null)
  const [originalAssignment, setOriginalAssignment] = useState(null)
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
      .from('reports')
      .select('*')
      .eq('report_id', reopenData.report_id)
      .single()
    setReport(reportData)

    // Find the original (resolved) assignment to know who to re-notify
    const { data: assignmentData } = await supabase
      .from('job_assignments')
      .select('*')
      .eq('report_id', reopenData.report_id)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setOriginalAssignment(assignmentData)

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

    // A fresh assignment row, preserving the original as historical record
    const { error: assignError } = await supabase.from('job_assignments').insert({
      report_id: reopen.report_id,
      lineman_id: originalAssignment.lineman_id,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    })

    if (assignError) {
      setError(assignError.message)
      setActionLoading(false)
      return
    }

    const { error: reopenError } = await supabase
      .from('reopen_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('reopen_id', reopenId)

    if (reopenError) {
      setError(reopenError.message)
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
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/supervisor/dispatch')}
        className="text-sm text-blue-700 font-medium mb-4"
      >
        ← Back to Dispatch
      </button>

      <h1 className="text-lg font-bold text-gray-900 mb-1">Ticket Reopen Request</h1>
      <p className="text-sm text-gray-500 mb-6">
        {report?.ticket_number} • Requested{' '}
        {new Date(reopen.requested_at).toLocaleString('en-PH', {
          month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">
            Original Report
          </p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-3">
            "{report?.report_details}"
          </p>
          {originalPhotoUrl ? (
            <img
              src={originalPhotoUrl}
              alt="Original evidence"
              className="w-full rounded-lg border border-gray-200"
            />
          ) : (
            <p className="text-xs text-gray-400 italic">No original photo.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border-2 border-amber-300 p-5">
          <p className="text-xs font-bold text-amber-700 uppercase mb-2">
            Reopen Request — New Details
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

      {originalAssignment && (
        <p className="text-sm text-gray-500 mb-6">
          Approving will re-notify the same lineman who handled the original repair.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
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
  )
}