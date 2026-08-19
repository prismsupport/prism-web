import { Clock, MapPin, Search, X } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import DeclineReportDialog from "@/components/DeclineReportDialog";
import ReportMap from "@/components/ReportMap";
import ReportPhoto from "@/components/ReportPhoto";
import ReportPriorityPicker from "@/components/ReportPriorityPicker";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  formatArea,
  formatDateTime,
  PRIORITY_LEVELS,
  STATUS_LABELS,
} from "@/lib/reports";
import {
  declineReport,
  getReportById,
  setReportPriority,
} from "@/services/reports.server";

function PanelMessage({ title, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
      <Link
        href="/supervisor/dispatch"
        className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800"
      >
        Back to Dispatch Management
      </Link>
    </div>
  );
}

async function declineReportAction(reportId, reason) {
  "use server";

  const trimmedReason = reason?.trim();

  if (!reportId || !trimmedReason) {
    return {
      ok: false,
      message: "Please give a reason before declining this report.",
    };
  }

  try {
    const declined = await declineReport(reportId, trimmedReason);

    if (!declined) {
      return {
        ok: false,
        message: "You don't have permission to decline this report.",
      };
    }
  } catch (error) {
    console.error("Failed to decline report", error);
    return {
      ok: false,
      message: "We couldn't decline this report right now. Please try again.",
    };
  }

  revalidatePath("/supervisor/dispatch");
  revalidatePath(`/supervisor/dispatch/${reportId}`);

  return { ok: true };
}

async function setReportPriorityAction(reportId, priority) {
  "use server";

  if (!reportId || !PRIORITY_LEVELS.includes(priority)) {
    return { ok: false, message: "That priority isn't valid." };
  }

  try {
    const updated = await setReportPriority(reportId, priority);

    if (!updated) {
      return {
        ok: false,
        message:
          "This report's priority can't be changed anymore. Refresh the page to see its current state.",
      };
    }
  } catch (error) {
    console.error("Failed to set report priority", error);
    return {
      ok: false,
      message: "We couldn't save the priority right now. Please try again.",
    };
  }

  revalidatePath("/supervisor/dispatch");
  revalidatePath(`/supervisor/dispatch/${reportId}`);

  return { ok: true };
}

export default async function ReportDetailPage({ params }) {
  const { reportId } = await params;

  let report;
  try {
    report = await getReportById(reportId);
  } catch (error) {
    console.error("Failed to load report", error);
    return (
      <PanelMessage
        title="We couldn't load this report right now."
        description="Please try again in a moment."
      />
    );
  }

  if (!report) {
    return (
      <PanelMessage
        title="Report not found"
        description="This report may have been removed, or the link is incorrect."
      />
    );
  }

  const areaText = formatArea(report);
  const landmark = report.nearest_landmark?.trim();
  const description = report.report_details?.trim();
  const isDeclined = report.status === "cancelled";

  return (
    <div className="grid gap-6 lg:h-full lg:grid-cols-[1.6fr_1fr]">
      <div className="h-[380px] overflow-hidden rounded-xl border border-gray-200 bg-white lg:h-full">
        {report.coordinates ? (
          <ReportMap
            latitude={report.coordinates.latitude}
            longitude={report.coordinates.longitude}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <MapPin className="h-6 w-6 text-gray-300" />
            <p className="mt-2 text-sm font-semibold text-gray-700">
              No map location
            </p>
            <p className="mt-1 text-xs text-gray-500">
              This report was submitted without coordinates.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold tracking-wide text-gray-900 uppercase">
                Report Details
              </h1>
              <p className="mt-1.5 text-xs font-bold tracking-wide text-gray-500 uppercase">
                Ticket:{" "}
                <span className="text-gray-900">{report.ticket_number}</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Report from{" "}
                <span className="font-semibold text-blue-600">
                  {report.consumerName ?? "Unknown consumer"}
                </span>
              </p>
            </div>

            <Link
              href="/supervisor/dispatch"
              aria-label="Close report details"
              title="Close report details"
              className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">
                Current Status
              </p>
              <div className="mt-1.5">
                <StatusBadge status={STATUS_LABELS[report.status]} />
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">
                Incident Priority
              </p>
              <ReportPriorityPicker
                reportId={report.report_id}
                priority={report.priority}
                status={report.status}
                onChangePriority={setReportPriorityAction}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">
                  Time Reported
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDateTime(report.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">
                  Location
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {landmark || areaText || "Location not set"}
                </p>
                {landmark && areaText && (
                  <p className="text-xs text-gray-500">{areaText}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">
              Description
            </p>
            {description ? (
              <p className="mt-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 italic">
                “{description}”
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                The consumer didn't add a description.
              </p>
            )}
          </div>

          {isDeclined && report.decline_reason && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5">
              <p className="text-[10px] font-bold tracking-wide text-red-600 uppercase">
                Decline Reason
              </p>
              <p className="mt-1 text-xs text-gray-700">
                {report.decline_reason}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:shrink-0">
          <h2 className="text-sm font-bold text-gray-900">Photo Evidence</h2>

          <ReportPhoto
            photoLink={report.photoLink}
            ticketNumber={report.ticket_number}
            hasPhoto={Boolean(report.photo_url)}
          />

          <div className="mt-4 space-y-2.5">
            <Button
              disabled
              title="Duplicate matching isn't available yet"
              className="h-11 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
              Check Duplicate Report
            </Button>

            {!isDeclined && (
              <DeclineReportDialog
                reportId={report.report_id}
                ticketNumber={report.ticket_number}
                consumerName={report.consumerName}
                onDecline={declineReportAction}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
