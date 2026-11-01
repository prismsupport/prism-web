import PencilIcon from '@/components/ui/icons/PencilIcon'
import TrashIcon from '@/components/ui/icons/TrashIcon'
import ArchiveIcon from '@/components/ui/icons/ArchiveIcon'

export default function RowActions({ onEdit, onDelete, archive = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button onClick={onEdit} className="text-blue-600 hover:text-blue-800" title="Edit">
        <PencilIcon />
      </button>
      {archive ? (
        <button onClick={onDelete} className="text-amber-600 hover:text-amber-800" title="Archive">
          <ArchiveIcon />
        </button>
      ) : (
        <button onClick={onDelete} className="text-red-500 hover:text-red-700" title="Delete">
          <TrashIcon />
        </button>
      )}
    </div>
  )
}