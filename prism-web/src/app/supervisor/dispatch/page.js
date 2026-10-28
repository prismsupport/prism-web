"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import DispatchStatCards from "@/components/dispatch/DispatchStatCards";
import DispatchFilters from "@/components/dispatch/DispatchFilters";
import DuplicateSuggestionCard from "@/components/dispatch/DuplicateSuggestionCard";
import DispatchTicketRow from "@/components/dispatch/DispatchTicketRow";
import StatusNamesModal from "@/components/dispatch/StatusNamesModal";
import ManagePriorityLevelsModal from "@/components/dispatch/ManagePriorityLevelsModal";
import OfficeHoursModal from "@/components/dispatch/OfficeHoursModal";
import { usePermissions } from "@/lib/supervisor/PermissionsContext";
import {
  useSupervisorNotificationRefresh,
  useUnreadSupervisorNotifications,
} from "@/lib/supervisor/useSupervisorLiveUpdates";
import EmptyState from "@/components/ui/EmptyState" 
import { TableSkeletonRows } from "@/components/ui/Skeleton"
import { toast } from "@/lib/toast"

const PAGE_SIZE = 10;

const REPORT_COLUMNS =
  "report_id, ticket_number, master_id, consumer_id, cooperative_id, status, priority, zone, barangay, municipality, nearest_landmark, created_at, updated_at, reopened_at";
const MASTER_COLUMNS =
  "master_id, master_ticket, cooperative_id, status, priority, barangay, municipality, report_count, created_at, reopened_at";
const ASSIGNMENT_COLUMNS =
  "assignment_id, report_id, master_id, lineman_id, status, assigned_at, updated_at, completed_at";

const VALID_STATUS_FILTERS = [
  'pending',
  'dispatched',
  'in_progress',
  'qa_review',
  'resolved',
  'cancelled',
]

const ASSIGNMENT_TO_BUCKET = {
  assigned: "dispatched",
  on_the_way: "dispatched",
  arrived_at_site: "in_progress",
  in_progress: "in_progress",
  fixed: "qa_review",
  resolved: "resolved",
};

function DispatchContent() {
  const searchParams = useSearchParams()
  const [showStatusNames, setShowStatusNames] = useState(false)
  const [showPriorityLevels, setShowPriorityLevels] = useState(false)
  const [showOfficeHours, setShowOfficeHours] = useState(false)
  const { isOwner } = usePermissions()
  const [reports, setReports] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [linemenNames, setLinemenNames] = useState({});
  const [clusters, setClusters] = useState([]);
  const [joinSuggestions, setJoinSuggestions] = useState([]);
  const [reopenRequests, setReopenRequests] = useState([]);
  const [masterTickets, setMasterTickets] = useState([]);

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Response Time Monitoring
  const [cooperativeId, setCooperativeId] = useState(null);
  const [threshold, setThreshold] = useState(30);
  const [thresholdInput, setThresholdInput] = useState("30");
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [overdueTickets, setOverdueTickets] = useState([]);
  const { isUnread, markNotificationRead } = useUnreadSupervisorNotifications([
    "reports",
  ]);

  useEffect(() => {
    loadEverything()
  }, [])

  // Open pre-filtered when linked from the Dashboard,
  // e.g. /supervisor/dispatch?status=qa_review
  useEffect(() => {
    const status = searchParams.get('status')
    setStatusFilter(VALID_STATUS_FILTERS.includes(status) ? status : 'all')
    setPage(1)
  }, [searchParams])
  useSupervisorNotificationRefresh(loadEverything);

  async function loadEverything() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    // getSession reads the saved login locally (no network trip, unlike getUser).
    // Row-level security still verifies the real token on every query below.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      setError("Unable to load your cooperative.");
      setLoading(false);
      return;
    }

    const { data: myRow, error: myRowError } = await supabase
      .from("users")
      .select("cooperative_id")
      .eq("id", user.id)
      .single();

    if (myRowError || !myRow) {
      setError("Unable to load your cooperative.");
      setLoading(false);
      return;
    }

    const coopId = myRow.cooperative_id;
    setCooperativeId(coopId);

    // Everything below only needs coopId, so fetch it all at the same time.
    const [settingsRes, reportsRes, mastersRes, clustersRes, joinsRes, reopenRes, overdueRes] =
      await Promise.all([
        supabase
          .from("cooperative_settings")
          .select("response_time_threshold_minutes")
          .eq("cooperative_id", coopId)
          .single(),
        supabase
          .from("reports")
          .select(REPORT_COLUMNS)
          .eq("cooperative_id", coopId)
          .is("master_id", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("master_tickets")
          .select(MASTER_COLUMNS)
          .eq("cooperative_id", coopId)
          .order("created_at", { ascending: false }),
        supabase.rpc("get_duplicate_clusters", { p_cooperative_id: coopId }),
        supabase.rpc("get_join_suggestions", { p_cooperative_id: coopId }),
        supabase
          .from("reopen_requests")
          .select(
            "reopen_id, report_id, description, requested_at, reports(ticket_number, consumer_id)",
          )
          .eq("status", "pending"),
        // Response Time Monitoring — checks + fires overdue notifications as a side effect
        supabase.rpc("check_response_time_overdue", { p_cooperative_id: coopId }),
      ]);

    const coop = settingsRes.data;
    if (coop?.response_time_threshold_minutes != null) {
      setThreshold(coop.response_time_threshold_minutes);
      setThresholdInput(String(coop.response_time_threshold_minutes));
    }

    if (reportsRes.error) setError(reportsRes.error.message);
    const standaloneReports = reportsRes.data || [];
    setReports(standaloneReports);

    if (mastersRes.error) setError((prev) => prev || mastersRes.error.message);
    const masterData = mastersRes.data || [];
    setMasterTickets(masterData);

    // Assignments need the ticket ids, so they come next (both lookups together).
    const reportIds = standaloneReports.map((r) => r.report_id);
    const masterIds = masterData.map((m) => m.master_id);

    const [byReport, byMaster] = await Promise.all([
      reportIds.length > 0
        ? supabase
            .from("job_assignments")
            .select(ASSIGNMENT_COLUMNS)
            .in("report_id", reportIds)
            .order("assigned_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      masterIds.length > 0
        ? supabase
            .from("job_assignments")
            .select(ASSIGNMENT_COLUMNS)
            .in("master_id", masterIds)
            .order("assigned_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);
    const assignmentData = [...(byReport.data || []), ...(byMaster.data || [])];
    setAssignments(assignmentData);

    const linemanIds = Array.from(
      new Set(assignmentData.map((a) => a.lineman_id).filter(Boolean)),
    );
    let namesMap = {};
    if (linemanIds.length > 0) {
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", linemanIds);
      (data || []).forEach((u) => {
        namesMap[u.id] = `${u.first_name} ${u.last_name}`;
      });
    }
    setLinemenNames(namesMap);

    if (clustersRes.error) setError((prev) => prev || clustersRes.error.message);
    setClusters(clustersRes.data || []);

    if (joinsRes.error) setError((prev) => prev || joinsRes.error.message);
    setJoinSuggestions(joinsRes.data || []);

    if (reopenRes.error) setError((prev) => prev || reopenRes.error.message);
    setReopenRequests(reopenRes.data || []);

    if (overdueRes.error) setError((prev) => prev || overdueRes.error.message);
    setOverdueTickets(overdueRes.data || []);

    setLoading(false);
  }

  async function handleSaveThreshold() {
    const parsed = parseInt(thresholdInput, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Response time threshold must be a positive number of minutes.");
      return;
    }

    setSavingThreshold(true);
    setError("");
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("cooperative_settings")
      .update({ response_time_threshold_minutes: parsed })
      .eq("cooperative_id", cooperativeId);

    if (updateError) {
      toast.error(updateError.message);
      setError(updateError.message);
      setSavingThreshold(false);
      return;
    }

    setThreshold(parsed);
    setSavingThreshold(false);
    toast.success("Response time threshold updated");
    loadEverything();
  }

  function assignmentFor(reportId, masterId) {
    return assignments.find(
      (a) =>
        (reportId && a.report_id === reportId) ||
        (masterId && a.master_id === masterId),
    );
  }

  const allTickets = [
    ...reports.map((r) => ({ ...r, kind: "report", ticketKey: r.report_id })),
    ...masterTickets.map((m) => ({
      ...m,
      kind: "master",
      ticketKey: m.master_id,
    })),
  ];

  function bucketForTicket(ticket) {
    const assignment =
      ticket.kind === "report"
        ? assignmentFor(ticket.report_id, null)
        : assignmentFor(null, ticket.master_id);
    if (assignment) {
      return ASSIGNMENT_TO_BUCKET[assignment.status] || ticket.status;
    }
    return ticket.status;
  }

  const counts = {
    pending: allTickets.filter((t) => bucketForTicket(t) === "pending").length,
    dispatched: allTickets.filter((t) => bucketForTicket(t) === "dispatched")
      .length,
    in_progress: allTickets.filter((t) => bucketForTicket(t) === "in_progress")
      .length,
    qa_review: allTickets.filter((t) => bucketForTicket(t) === "qa_review")
      .length,
    resolved: allTickets.filter((t) => bucketForTicket(t) === "resolved")
      .length,
  };

  const filtered = allTickets.filter((t) => {
    const priorityMatch =
      priorityFilter === "all" || t.priority === priorityFilter;
    const statusMatch =
      statusFilter === "all" || bucketForTicket(t) === statusFilter;
    return priorityMatch && statusMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clusteredReportIds = new Set(
    clusters.flatMap((c) => c.report_ids || []),
  );
  const overdueIds = new Set(overdueTickets.map((o) => o.ticket_id));

  const joinGroups = Object.values(
    joinSuggestions.reduce((acc, s) => {
      const key = `${s.target_type}-${s.target_id}`;
      if (!acc[key]) {
        acc[key] = {
          target_type: s.target_type,
          target_id: s.target_id,
          target_label: s.target_label,
          reportIds: [],
          maxScore: 0,
        };
      }
      acc[key].reportIds.push(s.report_id);
      acc[key].maxScore = Math.max(acc[key].maxScore, s.score);
      return acc;
    }, {}),
  );

  function handleFilterChange(setter, value) {
    setter(value);
    setPage(1);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dispatch Management</h1>
        <div className="flex items-center gap-3">
          {isOwner && (
            <button
              onClick={() => setShowOfficeHours(true)}
              className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
            >
              Office Hours
            </button>
          )}
          <button
            onClick={() => setShowPriorityLevels(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
          >
            Priority Levels
          </button>
          <button
            onClick={() => setShowStatusNames(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
          >
            Status Names
          </button>
        </div>
      </div>
      {showStatusNames && <StatusNamesModal onClose={() => setShowStatusNames(false)} />}
      {showOfficeHours && <OfficeHoursModal onClose={() => setShowOfficeHours(false)} />}
      {showPriorityLevels && (
        <ManagePriorityLevelsModal
          onClose={() => setShowPriorityLevels(false)}
          onSaved={() => {
            setPriorityFilter('all')
            loadEverything()
          }}
        />
      )}
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Real-time tickets monitoring and lineman coordination.
      </p>

      <DispatchStatCards
        counts={counts}
        statusFilter={statusFilter}
        onFilterChange={(value) => handleFilterChange(setStatusFilter, value)}
      />

      <DispatchFilters
        priorityFilter={priorityFilter}
        onPriorityChange={(value) =>
          handleFilterChange(setPriorityFilter, value)
        }
        statusFilter={statusFilter}
        onStatusChange={(value) => handleFilterChange(setStatusFilter, value)}
        statusOptions={Object.keys(counts)}
      />

      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <span className="text-xs font-bold text-gray-500 tracking-wide">
          RESPONSE TIME THRESHOLD
        </span>
        <input
          type="number"
          min={1}
          value={thresholdInput}
          onChange={(e) => setThresholdInput(e.target.value)}
          className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
        />
        <span className="text-sm text-gray-500">minutes</span>
        <button
          onClick={handleSaveThreshold}
          disabled={
            savingThreshold || parseInt(thresholdInput, 10) === threshold
          }
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {savingThreshold ? "Saving…" : "Save"}
        </button>
        <span className="text-xs text-gray-400 ml-2">
          Pending tickets unassigned past this limit are flagged below and
          notify supervisors once.
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {overdueTickets.map((o) => (
        <div
          key={o.ticket_id}
          className="flex items-center justify-between bg-white rounded-xl border border-red-200 p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-700">
              ⏱
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                RESPONSE TIME EXCEEDED
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">{o.ticket_number}</span> has been
                unassigned for{" "}
                <span className="font-semibold text-red-600">
                  {o.minutes_elapsed} minutes
                </span>{" "}
                (threshold: {threshold} min)
              </p>
            </div>
          </div>
          <Link
            href={
              o.ticket_kind === "master"
                ? `/supervisor/dispatch/master/${o.ticket_id}`
                : `/supervisor/dispatch/report/${o.ticket_id}`
            }
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Review Now
          </Link>
        </div>
      ))}

      {reopenRequests.map((r) => (
        <div
          key={r.reopen_id}
          className="flex items-center justify-between bg-white rounded-xl border border-amber-200 p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              ↺
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                TICKET REOPEN REQUEST
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">{r.reports?.ticket_number}</span>{" "}
                — Consumer requested this resolved ticket be reopened
              </p>
            </div>
          </div>
          <Link
            href={`/supervisor/dispatch/reopen/${r.reopen_id}`}
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Review Request
          </Link>
        </div>
      ))}

      {clusters.map((cluster) => (
        <DuplicateSuggestionCard
          key={cluster.cluster_anchor_id}
          type="cluster"
          title="POTENTIAL DUPLICATE"
          description={
            <>
              <span className="text-blue-700 font-medium">
                {cluster.area_label}
              </span>
              {"   "}Confidence:{" "}
              <span className="font-semibold text-green-600">
                {cluster.confidence}%
              </span>
              {"   "}Related Reports:{" "}
              <span className="font-semibold">{cluster.related_count}</span>
              {"   "}Status: Pending Administrator Review
            </>
          }
          href={`/supervisor/dispatch/cluster/${cluster.cluster_anchor_id}`}
          buttonLabel="Review Cluster"
        />
      ))}

      {joinGroups.map((g) => (
        <DuplicateSuggestionCard
          key={`${g.target_type}-${g.target_id}`}
          type="join"
          title={
            g.reportIds.length > 1
              ? `${g.reportIds.length} POSSIBLE MATCHES TO EXISTING TICKET`
              : "POSSIBLE MATCH TO EXISTING TICKET"
          }
          description={
            <>
              {g.reportIds.length} report{g.reportIds.length === 1 ? "" : "s"}{" "}
              may belong to{" "}
              <span className="text-purple-700 font-medium">
                {g.target_label}
              </span>
              {"   "}Best match:{" "}
              <span className="font-semibold text-green-600">
                {g.maxScore}%
              </span>
            </>
          }
          href={`/supervisor/dispatch/join-group/${g.target_type}/${g.target_id}?reports=${g.reportIds.join(",")}`}
          buttonLabel="Review Matches"
        />
      ))}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Ticket ID</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold">Job Order Status</th>
              <th className="px-5 py-3 font-semibold">Assignee</th>
              <th className="px-5 py-3 font-semibold">Last Updated</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <TableSkeletonRows rows={6} cols={7} />}
            {!loading && paginated.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="No tickets match this view"
                    description="Try a different filter, or wait for new outage reports to come in."
                  />
                </td>
              </tr>
            )}
            {!loading &&
              paginated.map((t) => {
                const isMaster = t.kind === "master";
                const assignment = isMaster
                  ? assignmentFor(null, t.master_id)
                  : assignmentFor(t.report_id, null);
                return (
                  <DispatchTicketRow
                    key={t.ticketKey}
                    ticket={t}
                    assignment={assignment}
                    bucket={bucketForTicket(t)}
                    isClustered={
                      !isMaster && clusteredReportIds.has(t.report_id)
                    }
                    isOverdue={overdueIds.has(t.ticketKey)}
                    assigneeName={
                      assignment ? linemenNames[assignment.lineman_id] : null
                    }
                    isUnread={
                      t.kind === "report" && isUnread("reports", t.report_id)
                    }
                    onOpen={() =>
                      t.kind === "report" &&
                      markNotificationRead("reports", t.report_id)
                    }
                  />
                );
              })}
          </tbody>
        </table>

        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}


export default function DispatchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
      <DispatchContent />
    </Suspense>
  )
}