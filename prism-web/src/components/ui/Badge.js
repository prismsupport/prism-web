const TONES = {
  blue: 'bg-blue-50 text-blue-700',
  blueStrong: 'bg-blue-100 text-blue-700',
  green: 'bg-green-50 text-green-700',
  greenStrong: 'bg-green-100 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  amberStrong: 'bg-amber-100 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
  purpleStrong: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
  grayStrong: 'bg-gray-200 text-gray-600',
}

const SIZES = {
  md: 'text-xs px-2 py-0.5',
  sm: 'text-xs px-1.5 py-0.5',
  xs: 'text-[10px] px-1.5 py-0.5',
}

// tone picks a preset colour; colorClass overrides it with any Tailwind colour classes
// (e.g. the per-category FAQ colours). bold={false} for regular-weight chips.
export default function Badge({
  tone = 'blue',
  size = 'md',
  bold = true,
  colorClass,
  className = '',
  children,
}) {
  return (
    <span
      className={`${bold ? 'font-bold ' : ''}rounded ${SIZES[size]} ${colorClass ?? TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
