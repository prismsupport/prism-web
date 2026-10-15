import StatusPill from "@/components/ui/StatusPill";

export default function TicketStatusPriority({ status, priority }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Current Status</p>
        <StatusPill status={status} />
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Priority</p>
        <StatusPill kind="priority" status={priority} />
      </div>
    </div>
  );
}