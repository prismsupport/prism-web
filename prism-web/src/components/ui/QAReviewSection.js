'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reopenAssignment } from '@/lib/dispatch/reopenAssignment'
import { toast } from '@/lib/toast'
import { issueLabel } from '@/lib/issueCodes'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ReasonBox from '@/components/ui/ReasonBox'
import ProofLocationBadge from '@/components/dispatch/ProofLocationBadge'
import VideoDropdown from '@/components/dispatch/VideoDropdown'
import StickyActionBar from '@/components/dispatch/StickyActionBar'

// issueCode and proofLocationConsistent are optional (single reports only).
// A Master Ticket has several reports, so the page leaves them out.
export default function QAReviewSection({
  assignment,
  reportId,
  masterId,
  onReviewed,
  issueCode,
  proofLocationConsistent,
  showReportInfo = false,
  actionPortalId,
}) {
  const { statusLabel } = useStatusLabels()
  const [photoUrl, setPhotoUrl] = useState(null)
  const [voiceUrl, setVoiceUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionTarget, setActionTarget] = useState(null)

  useEffect(() => {
    if (!actionPortalId) return
    setActionTarget(document.getElementById(actionPortalId))
  }, [actionPortalId])

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
      toast.error(reviewError.message)
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
      toast.error(updateError.message)
      setError(updateError.message)
      setActionLoading(false)
      return
    }

    toast.success('Proof of completion approved')
    onReviewed()
  }

  async function handleReject() {
    if (!remarks.trim()) {
      toast.error('Please provide remarks explaining the rejection.')
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
      toast.error(reviewError.message)
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
      reason: remarks.trim(),
      source: 'qa_rejection',
    })

    if (reopenError) {
      toast.error(reopenError)
      setError(reopenError)
      setActionLoading(false)
      return
    }

    toast.success('Proof of completion rejected. Ticket reopened.')
    onReviewed()
  }

  const actionContent = assignment.status === 'resolved' ? (
    <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 font-medium">
      ✓ Approved and marked as {statusLabel('resolved')}
    </p>
  ) : !showRejectBox ? (
    <div className="flex gap-3">
      <Button variant="success" size="split" onClick={handleApprove} disabled={actionLoading}>
        {actionLoading ? 'Approving…' : 'Approve & Close Ticket'}
      </Button>
      <Button
        variant="dangerSoft"
        size="split"
        dim={false}
        onClick={() => setShowRejectBox(true)}
        disabled={actionLoading}
      >
        Reject
      </Button>
    </div>
  ) : (
    <ReasonBox
      value={remarks}
      onChange={setRemarks}
      placeholder="Explain what needs to be corrected…"
      confirmLabel={actionLoading ? 'Submitting…' : 'Confirm Rejection'}
      onConfirm={handleReject}
      onCancel={() => setShowRejectBox(false)}
      loading={actionLoading}
    />
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-3">
        Quality Assurance Review
      </h2>

      {showReportInfo && (
        <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Category</p>
            <p className="text-gray-900 font-medium">{issueLabel(issueCode)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Consumer evidence location</p>
            <ProofLocationBadge value={proofLocationConsistent} />
            {proofLocationConsistent === false && (
              <p className="text-xs text-amber-700 mt-1">
                Review the evidence. This does not block approval.
              </p>
            )}
          </div>
        </div>
      )}

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

        {assignment.video_url && (
          <VideoDropdown
            label="Proof of Completion Video"
            bucket="assignment-proofs"
            path={assignment.video_url}
          />
        )}

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

      <Alert>{error}</Alert>

      {assignment.status === 'resolved' ? (
        actionContent
      ) : actionTarget ? (
        createPortal(actionContent, actionTarget)
      ) : (
        <StickyActionBar>{actionContent}</StickyActionBar>
      )}
    </div>
  )
}