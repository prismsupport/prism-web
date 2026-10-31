import StatusPill from "@/components/ui/StatusPill"
import Badge from "@/components/ui/Badge"
import { ButtonLink } from "@/components/ui/Button"
import { formatDateTime, formatTime, DATETIME_FULL } from "@/lib/format"

export default function DispatchTicketRow({
  ticket,
  assignment,
  bucket,
  isClustered,
  isOverdue,
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

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-4">
        <p className="font-semibold text-gray-900">
          {isUnread && (
            <span className="inline-block w-2 h-2 mr-2 rounded-full bg-red-500 align-middle" />
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
          <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            Highly Likely Duplicate
          </p>
        )}
        {isOverdue && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Response Time Exceeded
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <StatusPill kind="priority" status={ticket.priority} />
      </td>
      <td className="px-5 py-4">
        <p className="font-medium text-gray-900">
          {isMaster
            ? `${ticket.barangay}, ${ticket.municipality}`
            : ticket.nearest_landmark || `${ticket.barangay}, ${ticket.municipality}`}
        </p>
        <p className="text-xs text-gray-400">
          {!isMaster && `Zone ${ticket.zone || "—"}, `}
          {ticket.barangay}, {ticket.municipality} •{" "}
          {formatTime(ticket.created_at)}
        </p>
      </td>
      <td className="px-5 py-4">
        <StatusPill status={bucket} labelOf={status} />
      </td>
      <td className="px-5 py-4 text-gray-700">
        {assignment ? assigneeName || "Assigned" : "Unassigned"}
      </td>
      <td className="px-5 py-4 text-gray-600">
        {formatDateTime(
          assignment?.updated_at ||
            assignment?.assigned_at ||
            ticket.updated_at ||
            ticket.created_at,
          DATETIME_FULL,
        )}
      </td>
      <td className="px-5 py-4 text-center">
        <ButtonLink
          href={detailHref}
          onClick={onOpen}
          size="row"
          variant={isReviewable ? "primary" : "neutral"}
        >
          {isReviewable ? "Review" : "View Details"}
        </ButtonLink>
      </td>
    </tr>
  );
}
