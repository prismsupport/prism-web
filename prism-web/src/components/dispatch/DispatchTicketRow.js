import StatusPill from "@/components/ui/StatusPill"
import Badge from "@/components/ui/Badge"
import ViewAction from "@/components/ui/ViewAction"
import { formatDate, formatTime } from "@/lib/format"

export default function DispatchTicketRow({
  ticket,
  assignment,
  bucket,
  isClustered,
  isOverdue,
  categoryLabel,
  recurringCount,
  assigneeName,
  isUnread,
  onOpen,
}) {
  const isMaster = ticket.kind === "master";
  const status = assignment ? assignment.status : ticket.status;
  const isReviewable = !isMaster && !assignment && ticket.status === "pending";
  const detailHref = isMaster
    ? `/supervisor/dispatch/master/${ticket.master_id}`
    : `/supervisor/dispatch/report/${ticket.report_id}`;
  const updatedAt =
    assignment?.updated_at ||
    assignment?.assigned_at ||
    ticket.updated_at ||
    ticket.created_at;

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4">
        <p className="font-semibold text-gray-900">
          {isUnread && (
            <span className="inline-block w-1.5 h-1.5 mr-1.5 rounded-full bg-red-500 align-middle" />
          )}
          {isMaster ? ticket.master_ticket : ticket.ticket_number}
          {isMaster && (
            <Badge size="sm" className="ml-2">
              MASTER · {ticket.report_count}
            </Badge>
          )}
          {!isMaster && ticket.reopened_at && (
            <Badge size="sm" tone="amber" className="ml-2">
              REOPENED
            </Badge>
          )}
        </p>
        {isClustered && (
          <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-green-600" />
            Highly Likely Duplicate
          </p>
        )}
        {isOverdue && (
          <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-red-600" />
            Response Time Exceeded
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <p className="text-gray-900">{categoryLabel}</p>
        {recurringCount > 0 && (
          <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Recurring · {recurringCount} reports
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <StatusPill kind="priority" status={ticket.priority} />
      </td>
      <td className="px-5 py-4">
        <p className="font-medium text-gray-900">
          {ticket.barangay}, {ticket.municipality}
        </p>
        <p className="text-xs text-gray-400">Reported {formatTime(ticket.created_at)}</p>
      </td>
      <td className="px-5 py-4">
        <StatusPill status={bucket} labelOf={status} />
      </td>
      <td className="px-5 py-4 text-gray-700">
        {assignment ? assigneeName || "Assigned" : "Unassigned"}
      </td>
      <td className="px-5 py-4 text-center text-gray-600">
        <span className="block">{formatTime(updatedAt)}</span>
        <span className="block">
          {formatDate(updatedAt, {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }).replace(/\//g, "-")}
        </span>
      </td>
      <td className="px-5 py-4 text-center">
        <ViewAction
          href={detailHref}
          onClick={onOpen}
          label={isReviewable ? "Review ticket" : "View ticket details"}
        >
        </ViewAction>
      </td>
    </tr>
  );
}