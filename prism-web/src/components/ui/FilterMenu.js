'use client'

import { useEffect, useState } from 'react'

// filters = [{ key, label, value, onChange, options: [{ value, label }], defaultValue?: 'all' }]
function isActive(f) {
  return f.value !== (f.defaultValue ?? 'all')
}

function clearAll(filters) {
  filters.filter(isActive).forEach((f) => f.onChange(f.defaultValue ?? 'all'))
}

function optionLabel(f) {
  return f.options.find((o) => o.value === f.value)?.label ?? f.value
}

export function FilterMenu({ filters, label = 'Filters' }) {
  const [open, setOpen] = useState(false)
  const count = filters.filter(isActive).length

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
          count > 0 || open
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
        </svg>
        {label}
        {count > 0 && (
          <span className="rounded-full bg-blue-700 px-1.5 text-[11px] font-bold leading-5 text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={label}
            className="absolute right-0 top-full z-20 mt-2 w-[min(34rem,calc(100vw-3rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filters.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    {f.label}
                  </span>
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="select-control w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => clearAll(filters)}
                disabled={count === 0}
                className="text-sm font-medium text-blue-700 disabled:opacity-40"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Removable chips for every active filter. Renders nothing when none are active.
export function FilterChips({ filters }) {
  const active = filters.filter(isActive)
  if (active.length === 0) return null

  return (
    <div className="flex basis-full flex-wrap items-center gap-2">
      {active.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-blue-700"
        >
          {f.label}: {optionLabel(f)}
          <button
            type="button"
            aria-label={`Remove ${f.label} filter`}
            onClick={() => f.onChange(f.defaultValue ?? 'all')}
            className="flex h-4 w-4 items-center justify-center rounded-full leading-none hover:bg-blue-100"
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => clearAll(filters)}
        className="text-xs font-medium text-blue-700"
      >
        Clear all
      </button>
    </div>
  )
}