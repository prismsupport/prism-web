const VARIANTS = {
  // Register page
  form: 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600',
  // Login page
  login:
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20',
}

export default function AuthInput({ variant = 'form', className = '', ...props }) {
  return <input className={`${VARIANTS[variant]} ${className}`} {...props} />
}
