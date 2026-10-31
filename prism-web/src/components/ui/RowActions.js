import PencilIcon from '@/components/ui/icons/PencilIcon'
import TrashIcon from '@/components/ui/icons/TrashIcon'

export default function RowActions({ onEdit, onDelete, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button onClick={onEdit} className="text-blue-600 hover:text-blue-800" title="Edit">
        <PencilIcon />
      </button>
      <button onClick={onDelete} className="text-red-500 hover:text-red-700" title="Delete">
        <TrashIcon />
      </button>
    </div>
  )
}
