export default function TicketDetailHeader({
  ticketNumber,
  reporterName,
  reopened,
  onClose,
  closeClassName = '',
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
            TICKET: {ticketNumber}
          </span>
          {reopened && (
            <span className="inline-block bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded">
              REOPENED
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
        {reporterName && (
          <p className="text-sm text-gray-500 mt-1">
            Report from{' '}
            <span className="text-blue-700 font-medium">{reporterName}</span>
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`text-gray-400 hover:text-gray-600 text-xl ${closeClassName}`}
        >
          ✕
        </button>
      )}
    </div>
  )
}