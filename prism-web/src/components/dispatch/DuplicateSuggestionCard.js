import Link from 'next/link'

export default function DuplicateSuggestionCard({ type, title, description, href, buttonLabel }) {
  const theme =
    type === 'join'
      ? { iconBg: 'bg-purple-50', iconColor: 'text-purple-700', btn: 'bg-purple-700 hover:bg-purple-800' }
      : { iconBg: 'bg-blue-50', iconColor: 'text-blue-700', btn: 'bg-blue-700 hover:bg-blue-800' }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${theme.iconBg} flex items-center justify-center ${theme.iconColor}`}>
          ⚟
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <Link
        href={href}
        className={`${theme.btn} text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap`}
      >
        {buttonLabel}
      </Link>
    </div>
  )
}