import Link from 'next/link'

const VARIANTS = {
  primary: 'text-white bg-blue-700 hover:bg-blue-800',
  danger: 'text-white bg-red-600 hover:bg-red-700',
  success: 'text-white bg-green-600 hover:bg-green-700',
  outline: 'text-gray-600 border border-gray-200 hover:bg-gray-50',
  dangerOutline: 'text-red-600 border border-red-200 hover:bg-red-50',
  soft: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  dangerSoft: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
  plain: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
  neutral:
    'border border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
}

const SIZES = {
  md: 'px-4 py-2.5 rounded-lg text-sm font-semibold',
  sm: 'px-3 py-2 rounded-lg text-sm font-semibold',
  compact: 'px-4 py-2 rounded-lg text-sm font-semibold',
  xs: 'px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap',
  wide: 'px-6 py-3 rounded-lg text-sm font-semibold',
  lg: 'w-full py-3 rounded-lg text-sm font-semibold',
  // Two buttons sharing a row, e.g. Confirm / Cancel
  split: 'flex-1 py-2.5 rounded-lg text-sm font-semibold',
  // Table row actions: Review / View Details
  row: 'inline-flex min-w-28 justify-center items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap',
  // Show / Hide toggles
  toggle:
    'group inline-flex w-fit items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap',
}

const DIM = { 60: 'disabled:opacity-60', 50: 'disabled:opacity-50' }

export function buttonClasses({ variant = 'primary', size = 'md', dim = 60, className = '' } = {}) {
  return [
    VARIANTS[variant],
    SIZES[size],
    'transition-colors',
    dim ? DIM[dim] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

// dim: 60 | 50 | false. Controls the disabled look (false = no dimming).
export default function Button({
  variant = 'primary',
  size = 'md',
  dim = 60,
  className = '',
  children,
  ...props
}) {
  return (
    <button className={buttonClasses({ variant, size, dim, className })} {...props}>
      {children}
    </button>
  )
}

// Same look, rendered as a Next.js link
export function ButtonLink({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <Link className={buttonClasses({ variant, size, dim: false, className })} {...props}>
      {children}
    </Link>
  )
}
