import { issueLabel } from '@/lib/issueCodes'
import { sameCategory } from '@/lib/ticketGrouping'

// Header shown above each category group.
// hasAnchor: there is a reference ticket to compare with (anchor or existing ticket).
export default function CategoryGroupHeader({
  label,
  count,
  hasAnchor = false,
  matchesAnchor = false,
  referenceLabel = 'anchor',
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-700">{label}</span>
      <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
        {count} report{count === 1 ? '' : 's'}
      </span>
      {hasAnchor &&
        (matchesAnchor ? (
          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
            SAME CATEGORY AS {referenceLabel.toUpperCase()}
          </span>
        ) : (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
            DIFFERENT CATEGORY FROM {referenceLabel.toUpperCase()}
          </span>
        ))}
      {hasAnchor && !matchesAnchor && (
        <span className="text-[11px] text-amber-700">
          The consumer may have chosen another label for the same fault. Review before merging.
        </span>
      )}
    </div>
  )
}

// Small note under a single report when its category differs from the reference
export function CategoryMismatchTag({ code, referenceCode, referenceLabel = 'anchor' }) {
  if (sameCategory(code, referenceCode)) return null
  return (
    <p className="mt-1 text-xs font-medium text-amber-700">
      Different category: {issueLabel(code)} ({referenceLabel}: {issueLabel(referenceCode)})
    </p>
  )
}