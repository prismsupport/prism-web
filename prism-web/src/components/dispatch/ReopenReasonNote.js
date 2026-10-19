export const REOPEN_SOURCE_LABELS = {
  supervisor: 'Reopened by supervisor',
  consumer: "Reopened at the consumer's request",
  qa_rejection: 'Sent back after QA review',
}

export default function ReopenReasonNote({ source, reason, className = '' }) {
  if (!reason) return null

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 ${className}`}>
      <p className="text-xs font-bold text-amber-800 uppercase mb-0.5">
        {REOPEN_SOURCE_LABELS[source] || 'Reopened'}
      </p>
      <p className="text-sm text-amber-900">{reason}</p>
    </div>
  )
}