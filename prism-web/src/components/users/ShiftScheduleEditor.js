'use client'

import DutyDaysPicker from '@/components/users/DutyDaysPicker'

const NEW_SHIFT = { name: '', start: '07:30', end: '16:00', days: [] }

export default function ShiftScheduleEditor({ value, onChange, disabled = false }) {
  function updateBlock(index, changes) {
    onChange(value.map((b, i) => (i === index ? { ...b, ...changes } : b)))
  }

  function addBlock() {
    onChange([...value, { ...NEW_SHIFT }])
  }

  function removeBlock(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-gray-500">
          No schedule set. This lineman is not restricted by shift.
        </p>
      )}

      {value.map((block, i) => {
        const overnight = block.start && block.end && block.end < block.start
        return (
          <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <input
                value={block.name}
                onChange={(e) => updateBlock(i, { name: e.target.value })}
                disabled={disabled}
                placeholder="Shift name, e.g. Morning Duty"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm placeholder-gray-400 disabled:opacity-60"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  className="text-xs font-semibold text-red-600"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                <input
                  type="time"
                  value={block.start}
                  onChange={(e) => updateBlock(i, { start: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                <input
                  type="time"
                  value={block.end}
                  onChange={(e) => updateBlock(i, { end: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm disabled:opacity-60"
                />
              </div>
            </div>

            {overnight && (
              <p className="text-xs text-gray-500 mb-2">
                Overnight shift: it belongs to the day it starts and ends the next morning.
              </p>
            )}

            <p className="text-xs font-medium text-gray-500 mb-1.5">Duty days</p>
            <DutyDaysPicker
              value={block.days}
              onChange={(days) => updateBlock(i, { days })}
              disabled={disabled}
            />
          </div>
        )
      })}

      {!disabled && (
        <button
          type="button"
          onClick={addBlock}
          className="text-sm text-blue-700 font-medium"
        >
          + Add Shift
        </button>
      )}
    </div>
  )
}