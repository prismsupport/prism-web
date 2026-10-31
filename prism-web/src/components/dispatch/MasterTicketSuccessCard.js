import Button from '@/components/ui/Button'

export default function MasterTicketSuccessCard({ masterTicketNumber, areaLabel, reportCount, onAssignLineman }) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Master Ticket Created Successfully
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Master Ticket{' '}
          <span className="font-semibold text-gray-700">#{masterTicketNumber}</span>{' '}
          has been successfully created. All {reportCount} individual reports have been linked.
        </p>

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-3 gap-2 text-left mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">Master Ticket ID</p>
            <p className="text-sm font-semibold text-gray-900">{masterTicketNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">Location</p>
            <p className="text-sm font-semibold text-gray-900">{areaLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">Linked Reports</p>
            <p className="text-sm font-semibold text-gray-900">{reportCount} Reports</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-0 bg-white rounded-b-xl border-x border-b border-gray-200 p-6">
        <Button size="lg" dim={false} onClick={onAssignLineman}>
          Assign Lineman
        </Button>
      </div>
    </div>
  )
}
