import MatchReviewCard from '@/components/dispatch/MatchReviewCard'
import { buildBreakdownFactors } from '@/lib/scoring/masterTicketScoringConfig'

export default function ClusterMemberList({ members, expandedId, onToggleExpand, onToggleChecked }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900">Reports in this Cluster</h2>
        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
          TOTAL: {members.length}
        </span>
      </div>

      <div className="space-y-2">
        {members.map((m) => {
          const isExpanded = expandedId === m.report_id
          const factors = buildBreakdownFactors(m.breakdown)

          return (
            <div
              key={m.report_id}
              className={`border rounded-lg ${
                m.isAnchor
                  ? 'border-blue-300'
                  : m.checked === false
                  ? 'border-gray-200 opacity-60'
                  : 'border-gray-200'
              }`}
            >
              <div className="w-full flex items-center justify-between p-3">
                <div className="flex items-start gap-3">
                  {!m.isAnchor && (
                    <input
                      type="checkbox"
                      checked={m.checked !== false}
                      onChange={() => onToggleChecked(m.report_id)}
                      className="w-4 h-4 mt-1"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {m.reporterName?.first_name} {m.reporterName?.last_name}
                      {m.isAnchor && (
                        <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          ANCHOR
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.ticket_number}</p>
                    {!m.isAnchor && m.breakdown && (
                      <p className="text-xs text-gray-400">
                        {m.breakdown.total_score}% match vs anchor
                        {m.breakdown.feeder_match === false && (
                          <span className="text-red-500 font-medium"> — different feeder</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onToggleExpand(isExpanded ? null : m.report_id)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  {isExpanded ? 'Hide' : 'Review'}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-3 space-y-3">
                  <MatchReviewCard
                    title="Report Details"
                    ticketLabel={m.ticket_number}
                    barangay={m.barangay}
                    municipality={m.municipality}
                    zone={m.zone}
                    nearestLandmark={m.nearest_landmark}
                    description={m.report_details}
                    photoUrl={m.photo_url}
                    otherHomesAffected={m.other_homes_affected}
                  />
                  {!m.isAnchor && factors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        Match Breakdown vs Anchor
                      </p>
                      {factors.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={f.passed ? 'text-green-600' : 'text-gray-300'}>
                            {f.passed ? '✓' : '✗'}
                          </span>
                          <span className={f.passed ? 'text-gray-700' : 'text-gray-400'}>
                            {f.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}