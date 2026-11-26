import Link from 'next/link'

export default function AdvisorySummary({ counts, className = '', manageHref }) {
  return (
    <div className={`${className} rounded-2xl border border-gray-200 bg-white p-5 shadow-sm`}>
      {manageHref ? (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Power Interruption Advisories</h2>
          <Link href={manageHref} className="text-xs font-semibold text-blue-700">
            Manage advisories
          </Link>
        </div>
      ) : (
        <h2 className="mb-4 text-sm font-bold text-gray-900">Power Interruption Advisories</h2>
      )}
      <div className="grid grid-cols-4 gap-4">
        <div><p className="text-xs text-gray-400">All</p><p className="text-xl font-bold text-blue-700">{counts.all}</p></div>
        <div><p className="text-xs text-gray-400">Upcoming</p><p className="text-xl font-bold text-amber-600">{counts.upcoming}</p></div>
        <div><p className="text-xs text-gray-400">Active</p><p className="text-xl font-bold text-green-600">{counts.active}</p></div>
        <div><p className="text-xs text-gray-400">Completed</p><p className="text-xl font-bold text-gray-900">{counts.completed}</p></div>
      </div>
    </div>
  )
}