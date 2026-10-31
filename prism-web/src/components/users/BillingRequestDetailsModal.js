'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import BillingStatusPill from '@/components/users/BillingStatusPill'
import BillingVerificationPanel from '@/components/billing/BillingVerificationPanel'
import { formatDate } from '@/lib/format'
import { toast } from '@/lib/toast'

export default function BillingRequestDetailsModal({ request, onClose, onDecided }) {
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isRedVerdict = verdict === 'not_found' || verdict === 'mismatch'

  function openDecline() {
    if (!declineReason) {
      if (verdict === 'not_found') {
        setDeclineReason(
          'The account number you provided was not found in the cooperative billing records. Please check the account number and try again.'
        )
      } else if (verdict === 'mismatch') {
        setDeclineReason(
          'The account name you provided does not match the name on the cooperative billing record for this account number. Please check the details and try again.'
        )
      }
    }
    setShowDecline(true)
  }

  async function handleApprove() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('consumer_bill_links')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('link_id', request.link_id)

    if (updateError) {
      toast.error(updateError.message)
      setError(updateError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setShowSuccess(true)
    toast.success('Billing linkage approved')
  }

  async function handleConfirmDecline() {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason before declining.')
      setError('Please provide a reason before declining.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('consumer_bill_links')
      .update({
        status: 'rejected',
        rejection_reason: declineReason.trim(),
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('link_id', request.link_id)

    if (updateError) {
      toast.error(updateError.message)
      setError(updateError.message)
      setLoading(false)
      return
    }

    toast.success('Billing linkage declined')
    onDecided()
  }

  if (showSuccess) {
    return (
      <Modal title="" onClose={onDecided}>
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Linkage Approved Successfully!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The billing account <span className="font-semibold">{request.account_number}</span>{' '}
            has been successfully linked to the consumer's account.
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-3 gap-2 text-left mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Account Name</p>
              <p className="text-sm font-semibold text-gray-900">{request.account_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Account Number</p>
              <p className="text-sm font-semibold text-gray-900">{request.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Account Type</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {request.account_type}
              </p>
            </div>
          </div>
          <Button variant="success" size="lg" dim={false} onClick={onDecided}>
            DONE
          </Button>
        </div>
      </Modal>
    )
  }

  if (showDecline) {
    return (
      <Modal title="Decline Billing Request" onClose={onClose}>
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
          <p className="text-xs font-bold text-red-700 uppercase mb-2">
            Declining Request For
          </p>
          <p className="text-sm text-gray-900 font-semibold">
            Account Name: {request.account_name}
          </p>
          <p className="text-sm text-gray-900 font-semibold">
            Account Number: {request.account_number}
          </p>
        </div>

        <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
          REASON / REMARKS
        </label>
        <textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          rows={4}
          placeholder="Provide specific details for the consumer regarding this decline..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
        />

        <Alert>{error}</Alert>

        <div className="flex justify-end gap-3">
          <Button variant="outline" dim={false} onClick={() => setShowDecline(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDecline} disabled={loading}>
            {loading ? 'Submitting…' : 'Confirm Decline'}
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Billing Request Details" onClose={onClose} size="xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold">Consumer Name</p>
          <p className="text-base font-semibold text-gray-900">
            {request.consumerName?.first_name} {request.consumerName?.last_name}
          </p>
        </div>
        <BillingStatusPill status={request.status} />
      </div>

      <FormSection title="Requestor Information">
        <FormField label="Account Name" value={request.account_name} disabled />
        <FormField label="Account Type" value={request.account_type} disabled />
        <FormField label="Date Requested" value={formatDate(request.request_at)} disabled />
        <FormField label="Account Number" value={request.account_number} disabled />
      </FormSection>

      {request.status === 'pending' && (
        <BillingVerificationPanel linkId={request.link_id} onVerdict={setVerdict} />
      )}

      {request.status === 'rejected' && request.rejection_reason && (
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-semibold text-gray-700">Rejection Reason:</span>{' '}
          {request.rejection_reason}
        </p>
      )}

      <Alert>{error}</Alert>

      {request.status === 'pending' && (
        <div className="flex justify-end gap-3">
          <Button variant="dangerOutline" dim={false} onClick={openDecline} disabled={loading}>
            Decline
          </Button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 ${
              isRedVerdict ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {loading ? 'Approving…' : isRedVerdict ? 'Approve Anyway' : 'Approve Linkage'}
          </button>
        </div>
      )}
    </Modal>
  )
}
