import PencilIcon from '@/components/ui/icons/PencilIcon'
import TrashIcon from '@/components/ui/icons/TrashIcon'
import { getCategoryColor } from '@/lib/faqCategoryColor'

export default function FaqEntryRow({ entry, archived = false, onEdit, onDelete, onRestore }) {
  const keywordList = entry.keywords
    ? entry.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : []
  const hasTagalog = !!(entry.question_tl || entry.answer_tl)

  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <span
          className={`inline-block text-xs font-bold px-2 py-0.5 rounded mr-2 uppercase ${getCategoryColor(entry.category)}`}
        >
          {entry.category}
        </span>
        {hasTagalog && (
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded mr-2 bg-green-50 text-green-700">
            EN + TL
          </span>
        )}
        <span className="text-xs text-gray-400">
          Updated{' '}
          {new Date(entry.updated_at).toLocaleDateString('en-PH', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
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
              <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 pt-1">
        {archived ? (
          <button
            onClick={() => onRestore(entry)}
            className="inline-flex justify-center items-center rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap"
          >
            Restore
          </button>
        ) : (
          <>
            <button
              onClick={() => onEdit(entry)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => onDelete(entry)}
              className="text-red-500 hover:text-red-700"
              title="Archive"
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </div>
  )
}