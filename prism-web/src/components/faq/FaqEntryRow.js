import PencilIcon from '@/components/ui/icons/PencilIcon'
import TrashIcon from '@/components/ui/icons/TrashIcon'
import { getCategoryColor } from '@/lib/faqCategoryColor'

export default function FaqEntryRow({ entry, onEdit, onDelete }) {
  const keywordList = entry.keywords
    ? entry.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : []

  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <span
          className={`inline-block text-xs font-bold px-2 py-0.5 rounded mr-2 uppercase ${getCategoryColor(entry.category)}`}
        >
          {entry.category}
        </span>
        <span className="text-xs text-gray-400">
          Updated{' '}
          {new Date(entry.updated_at).toLocaleDateString('en-PH', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          {entry.question}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-semibold text-gray-700">Answer:</span>{' '}
          {entry.answer}
        </p>
        {keywordList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {keywordList.map((kw) => (
              <span
                key={kw}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 pt-1">
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
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}