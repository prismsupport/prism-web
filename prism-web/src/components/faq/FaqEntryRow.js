import RowActions from '@/components/ui/RowActions'
import Badge from '@/components/ui/Badge'
import { getCategoryColor } from '@/lib/faqCategoryColor'
import { formatDate } from '@/lib/format'

export default function FaqEntryRow({ entry, onEdit, onDelete }) {
  const keywordList = entry.keywords
    ? entry.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : []
  const hasTagalog = !!(entry.question_tl || entry.answer_tl)

  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <Badge colorClass={getCategoryColor(entry.category)} className="inline-block mr-2 uppercase">
          {entry.category}
        </Badge>
        {hasTagalog && (
          <Badge tone="green" className="inline-block mr-2">
            EN + TL
          </Badge>
        )}
        <span className="text-xs text-gray-400">Updated {formatDate(entry.updated_at)}</span>
        <p className="text-sm font-semibold text-gray-900 mt-1">{entry.question}</p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-semibold text-gray-700">Answer:</span> {entry.answer}
        </p>

        {hasTagalog ? (
          <div className="mt-2 border-l-2 border-green-200 pl-3">
            <p className="text-xs font-bold text-green-700 uppercase mb-0.5">Tagalog</p>
            {entry.question_tl && (
              <p className="text-sm font-semibold text-gray-800">{entry.question_tl}</p>
            )}
            {entry.answer_tl && <p className="text-sm text-gray-600 mt-0.5">{entry.answer_tl}</p>}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic mt-2">No Tagalog version yet</p>
        )}

        {keywordList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {keywordList.map((kw) => (
              <Badge key={kw} tone="gray" bold={false}>
                {kw}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <RowActions className="pt-1" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} />
    </div>
  )
}
