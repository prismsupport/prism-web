export function FilterBar({ className = 'flex items-center justify-between', children }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 mb-6 flex-wrap gap-3 ${className}`}>
      {children}
    </div>
  )
}

export function FilterSelect({ label, value, onChange, children, ...props }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-bold text-gray-500 tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-control text-sm border border-gray-200 rounded-lg px-3 py-1.5"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}