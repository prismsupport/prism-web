import PhotoDropdown from '@/components/dispatch/PhotoDropdown'
import ReopenReasonNote from '@/components/dispatch/ReopenReasonNote'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'

export default function AttemptReviewCard({ attempt }) {
  const { statusLabel } = useStatusLabels()

  return (
    <div
      className={`bg-white rounded-xl border p-5 ${
        attempt.isCurrent ? 'border-blue-300' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500 uppercase">
          QA Review — Attempt {attempt.attemptNumber}
          {attempt.isCurrent && (
            <span className="ml-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              CURRENT
            </span>
          )}
        </p>
        <span className="text-xs font-medium text-gray-400">{attempt.linemanName}</span>
      </div>
      <p className="text-xs text-gray-400 mb-2">
        Assigned{' '}
        {new Date(attempt.assigned_at).toLocaleString('en-PH', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })}
      </p>

      <ReopenReasonNote
        source={attempt.reopen_source}
        reason={attempt.reopen_reason}
        className="mb-2"
      />

      {attempt.logs.length > 0 && (
        <div className="space-y-1 mb-2">
          {attempt.logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">{statusLabel(log.new_status)}</span>
              <span className="text-gray-400">
                {new Date(log.changed_at).toLocaleString('en-PH', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      {attempt.repair_note && (
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 mb-2">
          {attempt.repair_note}
        </p>
      )}

      <PhotoDropdown label="Completion Photo" photoUrl={attempt.photoUrl} />

      {attempt.review && (
        <p className={`text-xs font-bold mt-2 ${attempt.review.decision === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
          QA: {attempt.review.decision === 'approved' ? '✓ Approved' : '✗ Rejected'}
          {attempt.review.remarks && ` — ${attempt.review.remarks}`}
        </p>
      )}
    </div>
  )
}