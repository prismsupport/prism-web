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
          <button
            onClick={onApprove}
            disabled={actionLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            {actionLoading ? 'Processing…' : 'Approve'}
          </button>
          <button
            onClick={onShowRejectBox}
            disabled={actionLoading}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm py-2.5 rounded-lg transition-colors border border-red-200"
          >
            Reject
          </button>
        </div>
      )}

      {isPending && showRejectBox && (
        <div className="mt-6">
          <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
            REJECTION REASON
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            rows={3}
            placeholder="Explain why this registration is being rejected…"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={onConfirmReject}
              disabled={actionLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              {actionLoading ? 'Submitting…' : 'Confirm Rejection'}
            </button>
            <button
              onClick={onCancelReject}
              disabled={actionLoading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isActive && !showDeactivateConfirm && (
        <div className="mt-6">
          <button
            onClick={onShowDeactivateConfirm}
            disabled={actionLoading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            Deactivate Cooperative
          </button>
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
          <button
            onClick={onReactivate}
            disabled={actionLoading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            {actionLoading ? 'Reactivating…' : 'Reactivate Cooperative'}
          </button>
        </div>
      )}
    </>
  )
}