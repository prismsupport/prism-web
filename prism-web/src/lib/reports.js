// Display helpers shared by the dispatch list and the report detail page.

// report_status enum -> display label. StatusBadge is keyed by these labels.
export const STATUS_LABELS = {
  pending: "Pending",
  dispatched: "Dispatched",
  in_progress: "In Progress",
  qa_review: "QA Review",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITY_PILL_COLORS = {
  low: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
  critical: "bg-red-600 text-white",
};

export function formatArea(report) {
  // zone may be stored either as "5" or already as "Zone 5"
  const zone = report.zone?.trim();
  const zoneText = zone && (/^zone\b/i.test(zone) ? zone : `Zone ${zone}`);

  return [zoneText, report.barangay, report.municipality]
    .filter(Boolean)
    .join(", ");
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Pinned to Manila so a Server Component render doesn't show the host's timezone.
export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}
