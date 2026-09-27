import PencilIcon from '@/components/ui/icons/PencilIcon'
import TrashIcon from '@/components/ui/icons/TrashIcon'

export default function ServiceAreaRow({ area, onEdit, onDelete }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-semibold text-gray-900">{area.barangay}</td>
      <td className="px-5 py-4 text-gray-700">{area.municipality}</td>
      <td className="px-5 py-4 text-gray-500">{area.province || '—'}</td>
      <td className="px-5 py-4">
        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
          {area.feeder}
        </span>
      </td>
      <td className="px-5 py-4 text-gray-600">{area.substation}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(area)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => onDelete(area)}
            className="text-red-500 hover:text-red-700"
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  )
}