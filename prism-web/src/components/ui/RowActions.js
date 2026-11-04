import PencilIcon from '@/components/ui/icons/PencilIcon'
import TrashIcon from '@/components/ui/icons/TrashIcon'
import ArchiveIcon from '@/components/ui/icons/ArchiveIcon'

export default function RowActions({ onEdit, onDelete, archive = false, className = '' }) {
  const removeLabel = archive ? 'Archive' : 'Delete'
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={onEdit}
        className="text-blue-600 hover:text-blue-800"
        title="Edit"
        aria-label="Edit"
      >
        <PencilIcon />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={
          archive
            ? 'text-amber-600 hover:text-amber-800'
            : 'text-red-500 hover:text-red-700'
        }
        title={removeLabel}
        aria-label={removeLabel}
      >
        {archive ? <ArchiveIcon /> : <TrashIcon />}
      </button>
    </div>
  )
}