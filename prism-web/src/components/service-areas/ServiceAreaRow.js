import PencilIcon from '@/components/ui/icons/PencilIcon'
import TrashIcon from '@/components/ui/icons/TrashIcon'

export default function ServiceAreaRow({ area, archived = false, onEdit, onDelete, onRestore }) {
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
        {area.area_office ? (
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            {area.area_office}
          </span>
        ) : (
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
            Unassigned
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        {archived ? (
          <button
            onClick={() => onRestore(area)}
            className="inline-flex justify-center items-center rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap"
          >
            Restore
          </button>
        ) : (
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
              title="Archive"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}