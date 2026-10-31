import Button from '@/components/ui/Button'
import ReasonBox from '@/components/ui/ReasonBox'

export default function CooperativeStatusActions({
  isPending,
  isActive,
  isDeactivated,
  showRejectBox,
  rejectReason,
  onRejectReasonChange,
  showDeactivateConfirm,
  onApprove,
  onShowRejectBox,
  onConfirmReject,
  onCancelReject,
  onShowDeactivateConfirm,
  onDeactivate,
  onCancelDeactivate,
  onReactivate,
  actionLoading,
}) {
  return (
    <>
      {isPending && !showRejectBox && (
        <div className="flex gap-3 mt-6">
          <Button variant="success" size="split" onClick={onApprove} disabled={actionLoading}>
            {actionLoading ? 'Processing…' : 'Approve'}
          </Button>
          <Button
            variant="dangerSoft"
            size="split"
            dim={false}
            onClick={onShowRejectBox}
            disabled={actionLoading}
          >
            Reject
          </Button>
        </div>
      )}

      {isPending && showRejectBox && (
        <ReasonBox
          className="mt-6"
          label="REJECTION REASON"
          value={rejectReason}
          onChange={onRejectReasonChange}
          placeholder="Explain why this registration is being rejected…"
          focusRing="focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          confirmLabel={actionLoading ? 'Submitting…' : 'Confirm Rejection'}
          onConfirm={onConfirmReject}
          onCancel={onCancelReject}
          loading={actionLoading}
        />
      )}

      {isActive && !showDeactivateConfirm && (
        <div className="mt-6">
          <Button
            variant="soft"
            size="split"
            dim={false}
            className="w-full"
            onClick={onShowDeactivateConfirm}
            disabled={actionLoading}
          >
            Deactivate Cooperative
          </Button>
        </div>
      )}

      {isActive && showDeactivateConfirm && (
        <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-700 mb-3">
            Deactivating this cooperative will immediately block its
            Supervisor, Linemen, and Consumers from logging in. This
            action can only be reversed manually. Are you sure?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onDeactivate}
              disabled={actionLoading}
              className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              {actionLoading ? 'Deactivating…' : 'Yes, Deactivate'}
            </button>
            <button
              onClick={onCancelDeactivate}
              disabled={actionLoading}
              className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm py-2.5 rounded-lg transition-colors border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isDeactivated && (
        <div className="mt-6">
          <Button size="split" className="w-full" onClick={onReactivate} disabled={actionLoading}>
            {actionLoading ? 'Reactivating…' : 'Reactivate Cooperative'}
          </Button>
        </div>
      )}
    </>
  )
}
