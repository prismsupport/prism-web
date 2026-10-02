'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reopenAssignment } from '@/lib/dispatch/reopenAssignment'

export default function QAReviewSection({ assignment, reportId, masterId, onReviewed }) {
  const [photoUrl, setPhotoUrl] = useState(null)
  const [voiceUrl, setVoiceUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
  async function loadMedia() {
    const supabase = createClient()

    if (assignment.photo_url) {
      const { data } = await supabase.storage
        .from('assignment-proofs')
        .createSignedUrl(assignment.photo_url, 3600)
      if (data) setPhotoUrl(data.signedUrl)
    }

    if (assignment.voice_record) {
      const { data } = await supabase.storage
        .from('assignment-proofs')
        .createSignedUrl(assignment.voice_record, 3600)
      if (data) setVoiceUrl(data.signedUrl)
    }

    setLoading(false)
  }
  loadMedia()
}, [assignment.photo_url, assignment.voice_record])

  async function handleApprove() {
    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: reviewError } = await supabase.from('qa_reviews').insert({
      assignment_id: assignment.assignment_id,
      reviewer_id: user.id,
      reviewer_type: 'supervisor',
      decision: 'approved',
    })

    if (reviewError) {
      setError(reviewError.message)
      setActionLoading(false)
      return
    }

    // Sync trigger cascades this into reports.status / master_tickets.status
    const { error: updateError } = await supabase
      .from('job_assignments')
      .update({ status: 'resolved', completed_at: new Date().toISOString() })
      .eq('assignment_id', assignment.assignment_id)

    if (updateError) {
      setError(updateError.message)
      setActionLoading(false)
      return
    }

    onReviewed()
  }

  async function handleReject() {
    if (!remarks.trim()) {
      setError('Please provide remarks explaining the rejection.')
      return
    }
    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: reviewError } = await supabase.from('qa_reviews').insert({
      assignment_id: assignment.assignment_id,
      reviewer_id: user.id,
      reviewer_type: 'supervisor',
      decision: 'rejected',
      remarks: remarks.trim(),
    })

    if (reviewError) {
      setError(reviewError.message)
      setActionLoading(false)
      return
    }

    // Sends the job back to the lineman as a fresh cycle — same pattern
    // as a formal reopen request — so this rejected attempt stays intact
    // as history instead of being overwritten.
    const { error: reopenError } = await reopenAssignment({
      reportId,
      masterId,
      linemanId: assignment.lineman_id,
    })

    if (reopenError) {
      setError(reopenError)
      setActionLoading(false)
      return
    }

    onReviewed()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-3">
        Quality Assurance Review
      </h2>

      <div className="space-y-3 text-sm mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Proof of Completion Photo</p>
          {loading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : photoUrl ? (
            <img
              src={photoUrl}
              alt="Completion evidence"
              className="w-full rounded-lg border border-gray-200"
            />
          ) : (
            <p className="text-xs text-gray-400 italic">No photo submitted.</p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-400">Repair Note</p>
          <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mt-1">
            {assignment.repair_note || 'No note submitted.'}
          </p>
        </div>

        {assignment.voice_record && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Voice Record</p>
            {voiceUrl ? (
              <audio key={voiceUrl} controls className="w-full">
                <source src={voiceUrl} type="audio/mp4" />
              </audio>
            ) : (
              <p className="text-xs text-gray-400">Loading audio…</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {assignment.status === 'resolved' ? (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 font-medium">
          ✓ Approved and marked as Resolved
        </p>
      ) : !showRejectBox ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg"
          >
            {actionLoading ? 'Approving…' : 'Approve & Close Ticket'}
          </button>
          <button
            onClick={() => setShowRejectBox(true)}
            disabled={actionLoading}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm py-2.5 rounded-lg border border-red-200"
          >
            Reject
          </button>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
            REASON FOR REJECTION
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Explain what needs to be corrected…"
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