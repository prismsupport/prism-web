export default function TicketDetailHeader({ ticketNumber, reporterName, onClose }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded mb-2">
          TICKET: {ticketNumber}
        </span>
        <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
        {reporterName && (
          <p className="text-sm text-gray-500 mt-1">
            Report from{' '}
            <span className="text-blue-700 font-medium">{reporterName}</span>
          </p>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
          ✕
        </button>
      )}
    </div>
  )
}