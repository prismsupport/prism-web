import { createClient } from "@/lib/supabase/client";

// Values of the report_status and priority_level Postgres enums.
export const REPORT_STATUSES = [
  "pending",
  "dispatched",
  "in_progress",
  "qa_review",
  "resolved",
  "cancelled",
];

export const REPORT_PRIORITIES = ["low", "medium", "high", "critical"];

// `location` is PostGIS geometry and is deliberately not selected — the
// readable address is built from zone/barangay/municipality/nearest_landmark.
const REPORT_COLUMNS =
  "report_id, ticket_number, zone, barangay, municipality, nearest_landmark, status, priority, created_at";

export async function getReports({
  status,
  priority,
  page = 1,
  pageSize = 10,
} = {}) {
  const supabase = createClient();

  let query = supabase
    .from("reports")
    .select(REPORT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (priority) {
    query = query.eq("priority", priority);
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error) {
    throw error;
  }

  return { reports: data ?? [], totalCount: count ?? 0 };
}

export async function getReportStatusCounts(statuses) {
  const supabase = createClient();

  const results = await Promise.all(
    statuses.map((status) =>
      supabase
        .from("reports")
        .select("report_id", { count: "exact", head: true })
        .eq("status", status),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed) {
    throw failed.error;
  }

  const counts = {};
  statuses.forEach((status, index) => {
    counts[status] = results[index].count ?? 0;
  });

  return counts;
}
