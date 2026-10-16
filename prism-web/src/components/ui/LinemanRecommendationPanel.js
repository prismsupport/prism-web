'use client'

import { useState } from 'react'
import { formatLastSeen } from '@/lib/lineman/duty'

const PRIORITIES = ['low', 'medium', 'high', 'critical']

const REASON_LABEL = {
  on_duty: 'On duty',
  no_signal: 'No signal',
  off_schedule: 'Off schedule',
}

function availabilityNote(l) {
  if (l.availability_reason === 'no_signal') {
    return l.has_schedule
      ? 'This lineman is scheduled but has not reported a location recently. They may be on a break or out of signal.'
      : 'This lineman has no schedule set and has not reported a location recently. They may not be logged in to the app.'
  }
  if (l.availability_reason === 'off_schedule') {
    return 'This lineman is outside their scheduled shift. Assign only for emergencies or if they are on call.'
  }
  return ''
}

function labelize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function estimateEtaMinutes(distanceMeters) {
  if (distanceMeters == null) return null
  const km = distanceMeters / 1000
  return Math.round((km / 30) * 60)
}

// Available first, then on duty but not reporting, then off schedule
function tier(l) {
  if (l.is_available) return 2
  return l.availability_reason === 'no_signal' ? 1 : 0
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

  // Scores are computed in the database (score_lineman_candidates).
  // This panel only displays them.
  const ranked = linemen
    .map((l) => ({ ...l, eta: estimateEtaMinutes(l.distance_meters) }))
    .sort((a, b) => tier(b) - tier(a) || b.total_score - a.total_score)

  const bestMatchId = ranked.find((l) => l.is_available)?.lineman_id
  const closestId = ranked
    .filter((l) => l.is_available && l.distance_meters != null)
    .sort((a, b) => a.distance_meters - b.distance_meters)[0]?.lineman_id

  const selected = ranked.find((l) => l.lineman_id === selectedId)

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
          Match % = 40% availability (on duty and reporting) + 30% assigned office + 20%
          proximity + 10% workload. Linemen who are off schedule or not reporting are
          listed after available ones. This is a decision-support tool; the final choice
          is yours.
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
      {!loading && ranked.length === 0 && (
        <p className="text-sm text-gray-500">No lineman accounts found.</p>
      )}

      <div className="space-y-3 mb-5">
        {ranked.map((l) => {
          const isSelected = selectedId === l.lineman_id
          const isBestMatch = l.lineman_id === bestMatchId
          const isClosest = l.lineman_id === closestId
          const isFreeNow = l.is_available && l.active_jobs === 0

          return (
            <button
              key={l.lineman_id}
              onClick={() => setSelectedId(l.lineman_id)}
              className={`w-full text-left border-2 rounded-lg p-4 transition-colors ${
                isSelected ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
              } ${!l.is_available ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {l.first_name} {l.last_name}
                    </p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
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
                      {l.office_match === 'match' && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          COVERS THIS AREA
                        </span>
                      )}
                      {isFreeNow && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          AVAILABLE NOW
                        </span>
                      )}
                      {l.on_call && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          ON-CALL
                        </span>
                      )}
                      {l.availability_reason === 'no_signal' && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          {formatLastSeen(l.location_updated_at)}
                        </span>
                      )}
                      {l.availability_reason === 'off_schedule' && (
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                          OFF SCHEDULE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-lg font-bold ${
                    l.is_available ? 'text-blue-700' : 'text-gray-400'
                  }`}
                >
                  {l.total_score}%
                </span>
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
                  <p
                    className={
                      !l.is_available
                        ? l.availability_reason === 'no_signal'
                          ? 'text-amber-600'
                          : 'text-gray-400'
                        : isFreeNow
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }
                  >
                    ●{' '}
                    {l.is_available
                      ? isFreeNow
                        ? 'Available'
                        : 'On duty'
                      : REASON_LABEL[l.availability_reason]}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 mt-2">
                Availability {l.availability_score} · Office {l.office_score} · Proximity{' '}
                {l.proximity_score} · Workload {l.workload_score}
                {!l.has_schedule && ' · No schedule set'}
              </p>
            </button>
          )
        })}
      </div>

      {selected && !selected.is_available && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          {availabilityNote(selected)}
        </p>
      )}

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