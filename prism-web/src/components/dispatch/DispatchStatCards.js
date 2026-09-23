import StatCard from './StatCard'

export default function DispatchStatCards({ counts, statusFilter, onFilterChange }) {
  const cards = [
    { key: 'pending', label: 'Pending', color: 'text-red-600' },
    { key: 'dispatched', label: 'Dispatched', color: 'text-amber-600' },
    { key: 'in_progress', label: 'In Progress', color: 'text-green-600' },
    { key: 'qa_review', label: 'QA Review', color: 'text-blue-700' },
    { key: 'resolved', label: 'Resolved', color: 'text-gray-900' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map((c) => (
        <StatCard
          key={c.key}
          label={c.label}
          value={counts[c.key]}
          color={c.color}
          active={statusFilter === c.key}
          onClick={() => onFilterChange(statusFilter === c.key ? 'all' : c.key)}
        />
      ))}
    </div>
  )
}