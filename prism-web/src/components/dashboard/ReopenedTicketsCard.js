export default function ReopenedTicketsCard({ count, hint }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Reopened tickets</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center py-4">
        <p className="font-display text-4xl font-extrabold tabular-nums text-gray-900">
          {count}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          {hint || 'Reports filed in this period'}
        </p>
      </div>
      <p className="border-t border-gray-100 pt-4 text-xs text-gray-400">
        Tickets reopened after being marked resolved.
      </p>
    </div>
  )
}