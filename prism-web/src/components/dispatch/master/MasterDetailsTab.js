import TicketDetailHeader from '@/components/dispatch/TicketDetailHeader'
import TicketStatusPriority from '@/components/dispatch/TicketStatusPriority'
import MasterAffectedConsumers from '@/components/dispatch/MasterAffectedConsumers'

// "Details" tab of the Master Ticket page. Display only: the page owns the data.
// masterIssues = [[label, count], ...]; codes = { report_id: issue_code }
export default function MasterDetailsTab({ master, currentStatus, masterIssues, members, memberCodes }) {
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <TicketDetailHeader
          ticketNumber={master.master_ticket}
          reopened={!!master.reopened_at}
        />

        <TicketStatusPriority status={currentStatus} priority={master.priority} />

        <div className="text-sm">
          <p className="text-xs text-gray-400">Location</p>
          <p className="text-gray-900 font-medium">
            {master.barangay}, {master.municipality}
          </p>
        </div>
        {masterIssues.length > 0 && (
          <div className="text-sm mt-3">
            <p className="text-xs text-gray-400">Reported concerns</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {masterIssues.map(([label, n]) => (
                <span key={label} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {label} · {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <MasterAffectedConsumers members={members} codes={memberCodes} />
    </>
  )
}