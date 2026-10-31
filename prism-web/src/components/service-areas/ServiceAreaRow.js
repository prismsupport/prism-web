import RowActions from '@/components/ui/RowActions'
import Badge from '@/components/ui/Badge'

export default function ServiceAreaRow({ area, onEdit, onDelete }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4 font-semibold text-gray-900">{area.barangay}</td>
      <td className="px-5 py-4 text-gray-700">{area.municipality}</td>
      <td className="px-5 py-4 text-gray-500">{area.province || '—'}</td>
      <td className="px-5 py-4">
        <Badge tone="purple" className="inline-block">{area.feeder}</Badge>
      </td>
      <td className="px-5 py-4 text-gray-600">{area.substation}</td>
      <td className="px-5 py-4">
        {area.area_office ? (
          <Badge tone="blue" className="inline-block">{area.area_office}</Badge>
        ) : (
          <Badge tone="amber" className="inline-block">Unassigned</Badge>
        )}
      </td>
      <td className="px-5 py-4">
        <RowActions onEdit={() => onEdit(area)} onDelete={() => onDelete(area)} />
      </td>
    </tr>
  )
}
