const SIZES = {
  md: 'py-2.5 bg-gray-50',
  lg: 'py-3 bg-white',
}

export default function SearchInput({
  value,
  onChange,
  placeholder,
  size = 'md',
  className = 'flex-1',
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-3.5 ${SIZES[size]} rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`}
      />
    </div>
  )
}
