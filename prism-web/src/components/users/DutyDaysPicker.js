'use client'

// Values match the database: 0 = Sunday ... 6 = Saturday
const DAYS = [
  { value: 0, letter: 'S', name: 'Sunday' },
  { value: 1, letter: 'M', name: 'Monday' },
  { value: 2, letter: 'T', name: 'Tuesday' },
  { value: 3, letter: 'W', name: 'Wednesday' },
  { value: 4, letter: 'T', name: 'Thursday' },
  { value: 5, letter: 'F', name: 'Friday' },
  { value: 6, letter: 'S', name: 'Saturday' },
]

export default function DutyDaysPicker({ value, onChange, disabled = false }) {
  function toggle(day) {
    if (disabled) return
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day]
    onChange(next.sort((a, b) => a - b))
  }

  return (
    <div className="flex gap-2">
      {DAYS.map((d) => {
        const selected = value.includes(d.value)
        return (
          <button
            key={d.value}
            type="button"
            title={d.name}
            aria-label={d.name}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => toggle(d.value)}
            className={`w-9 h-9 rounded-full text-sm font-semibold border transition-colors ${
              selected
                ? 'bg-blue-700 border-blue-700 text-white'
                : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {d.letter}
          </button>
        )
      })}
    </div>
  )
}