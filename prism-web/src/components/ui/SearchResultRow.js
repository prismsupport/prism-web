import Link from 'next/link'

export default function SearchResultRow({ result }) {
  return (
    <Link
      href={result.href}
      className="block border-b border-gray-100 px-5 py-4 last:border-0 hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">{result.title}</p>
          <p className="mt-1 text-sm text-gray-600">{result.subtitle}</p>
          <p className="mt-1 text-xs text-gray-400">{result.meta}</p>
        </div>
        <span className="shrink-0 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
          {result.type}
        </span>
      </div>
    </Link>
  )
}