export default function ClusterMemberList({ members, expandedId, onToggleExpand }) {
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
          return (
            <div key={m.report_id} className="border border-gray-200 rounded-lg">
              <div className="w-full flex items-center justify-between p-3">
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
                  {!m.isAnchor && (
                    <>
                      <p className="text-xs text-gray-400">{Math.round(m.distance)}m from anchor</p>
                      <p className="text-xs text-gray-400">{Math.round(m.minutesApart)} min apart</p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => onToggleExpand(isExpanded ? null : m.report_id)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  {isExpanded ? 'Hide' : 'Review'}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-3 text-sm space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-gray-900">
                      {m.nearest_landmark || `${m.barangay}, ${m.municipality}`}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Zone {m.zone || '—'}, {m.barangay}, {m.municipality}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-2 mt-1">
                      "{m.report_details}"
                    </p>
                  </div>
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt="Report evidence"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  ) : (
                    <p className="text-xs text-gray-400 italic">No photo submitted.</p>
                  )}
                  {m.other_homes_affected && (
                    <p className="text-xs text-amber-600 font-medium">
                      ⚠ Nearby households also affected
                    </p>
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