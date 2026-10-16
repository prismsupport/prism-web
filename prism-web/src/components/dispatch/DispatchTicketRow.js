import Link from "next/link";
import StatusPill from "@/components/ui/StatusPill"

function labelize(value) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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
            <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              MASTER · {ticket.report_count}
            </span>
          )}
          {!isMaster && ticket.reopened_at && (
            <span className="ml-2 text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              REOPENED
            </span>
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
            : ticket.nearest_landmark ||
              `${ticket.barangay}, ${ticket.municipality}`}
        </p>
        <p className="text-xs text-gray-400">
          {!isMaster && `Zone ${ticket.zone || "—"}, `}
          {ticket.barangay}, {ticket.municipality} •{" "}
          {formatTime(ticket.created_at)}
        </p>
      </td>
      <td className="px-5 py-4">
        <StatusPill status={bucket} label={labelize(status)} />
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
        )}
      </td>
      <td className="px-5 py-4 text-center">
        {isReviewable
          ? <Link
              href={detailHref}
              onClick={onOpen}
              className="inline-flex min-w-28 justify-center items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap"
            >
              Review
            </Link>
          : <Link
              href={detailHref}
              onClick={onOpen}
              className="inline-flex min-w-28 justify-center items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap"
            >
              View Details
            </Link>}
      </td>
    </tr>
  );
}
