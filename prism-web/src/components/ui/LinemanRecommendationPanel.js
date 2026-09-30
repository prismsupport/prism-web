'use client'

import { useState } from 'react'

const PRIORITIES = ['low', 'medium', 'high', 'critical']

function labelize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function computeScore(l) {
  const proximityScore =
    l.distance_meters != null ? Math.max(0, 100 * (1 - l.distance_meters / 5000)) : 50
  const workloadScore = Math.max(0, 100 * (1 - l.active_jobs / 5))
  const base = Math.round(0.6 * proximityScore + 0.4 * workloadScore)
  return l.area_match ? Math.min(100, base + 15) : base
}

function estimateEtaMinutes(distanceMeters) {
  if (distanceMeters == null) return null
  const km = distanceMeters / 1000
  return Math.round((km / 30) * 60)
}

export default function LinemanRecommendationPanel({
  linemen,
  loading,
  error,
  priority,
  onPriorityChange,
  onAssign,
  onBack,
  assigning,
}) {
  const [selectedId, setSelectedId] = useState(null)

  const scored = linemen
    .map((l) => ({ ...l, score: computeScore(l), eta: estimateEtaMinutes(l.distance_meters) }))
    .sort((a, b) => b.score - a.score)

  const bestMatchId = scored[0]?.lineman_id
  const closestId = scored
    .filter((l) => l.distance_meters != null)
    .sort((a, b) => a.distance_meters - b.distance_meters)[0]?.lineman_id

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full overflow-y-auto">
      <h1 className="text-lg font-bold text-gray-900 mb-4">
        Smart Dispatch Recommendation
      </h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Incident Priority
        </label>
        <select
          value={priority || 'low'}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {labelize(p)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-blue-50 text-blue-800 text-xs rounded-lg p-3 mb-5 flex gap-2">
        <span>ℹ</span>
        <span>
          Recommendations are based on service area coverage, estimated distance, current
          workload, and availability, and serve only as a decision-support tool.
        </span>
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase mb-2">
        Lineman Recommendations
      </p>

      {loading && <p className="text-sm text-gray-500">Loading recommendations…</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}
      {!loading && scored.length === 0 && (
        <p className="text-sm text-gray-500">No available linemen found.</p>
      )}

      <div className="space-y-3 mb-5">
        {scored.map((l) => {
          const isSelected = selectedId === l.lineman_id
          const isBestMatch = l.lineman_id === bestMatchId
          const isClosest = l.lineman_id === closestId
          const isAvailableNow = l.active_jobs === 0

          return (
            <button
              key={l.lineman_id}
              onClick={() => setSelectedId(l.lineman_id)}
              className={`w-full text-left border-2 rounded-lg p-4 transition-colors ${
                isSelected ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {l.first_name} {l.last_name}
                    </p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {l.area_match && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          COVERS THIS AREA
                        </span>
                      )}
                      {isBestMatch && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          BEST MATCH
                        </span>
                      )}
                      {isClosest && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          CLOSEST
                        </span>
                      )}
                      {isAvailableNow && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          AVAILABLE NOW
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-lg font-bold text-blue-700">{l.score}%</span>
              </div>

              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <div>
                  <p>
                    📍{' '}
                    {l.distance_meters != null
                      ? `${(l.distance_meters / 1000).toFixed(1)}km away`
                      : 'Location unknown'}
                  </p>
                  <p>🕐 {l.eta != null ? `ETA: ${l.eta} mins` : 'ETA unavailable'}</p>
                </div>
                <div className="text-right">
                  <p>
                    ✓ {l.active_jobs} active {l.active_jobs === 1 ? 'task' : 'tasks'}
                  </p>
                  <p className={isAvailableNow ? 'text-green-600' : 'text-blue-600'}>
                    ● {isAvailableNow ? 'Available' : 'Active'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <button
          onClick={() => selectedId && onAssign(selectedId)}
          disabled={!selectedId || assigning}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
        >
          {assigning ? 'Assigning…' : 'Assign Selected Lineman'}
        </button>
        <button
          onClick={onBack}
          disabled={assigning}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  )
}