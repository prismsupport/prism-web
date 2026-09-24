export default function TicketSummaryCard({ title, ticketLabel, location, description, meta }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-900 font-medium">{ticketLabel}</p>
      {location && <p className="text-xs text-gray-500 mt-1">{location}</p>}
      {description && (
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-2">"{description}"</p>
      )}
      {meta && <p className="text-xs text-gray-500 mt-1">{meta}</p>}
    </div>
  )
}