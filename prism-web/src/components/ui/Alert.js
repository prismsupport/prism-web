import { friendlyError } from '@/lib/friendlyError'

const TONES = {
  error: 'text-red-600 bg-red-50 border border-red-100',
  success: 'text-green-700 bg-green-50 border border-green-100',
  warning: 'text-amber-800 bg-amber-50 border border-amber-100',
  info: 'text-blue-800 bg-blue-50 border border-blue-100',
}

// Inline message box for validation inside a form or a panel.
// Results of actions (saved, failed) go to toast. className controls the margin (default mb-4).
export default function Alert({ tone = 'error', className = 'mb-4', children, ...props }) {
  if (!children) return null
  const content =
    tone === 'error' && typeof children === 'string' ? friendlyError(children) : children
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`text-sm rounded-lg px-3 py-2 ${TONES[tone]} ${className}`}
      {...props}
    >
      {content}
    </p>
  )
}