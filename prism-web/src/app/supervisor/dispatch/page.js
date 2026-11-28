"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import DispatchStatCards from "@/components/dispatch/DispatchStatCards";
import DispatchFilters, { DATE_RANGES } from "@/components/dispatch/DispatchFilters";
import DispatchAlerts from "@/components/dispatch/DispatchAlerts";
import DispatchTicketRow from "@/components/dispatch/DispatchTicketRow";
import DispatchTicketTable from "@/components/dispatch/DispatchTicketTable";
import DispatchModals from "@/components/dispatch/DispatchModals";
import Alert from '@/components/ui/Alert';
import { usePermissions } from "@/lib/supervisor/PermissionsContext";
import {
  useSupervisorNotificationRefresh,
  useUnreadSupervisorNotifications,
} from "@/lib/supervisor/useSupervisorLiveUpdates";
import { issueLabel } from "@/lib/issueCodes"
import {
  loadRecentIssueReports,
  buildRecurringGroups,
  recurringCountFor,
} from "@/lib/recurring"
import {
  ASSIGNMENT_TO_BUCKET,
  VALID_STATUS_FILTERS,
  buildJoinGroups,
  dominantIssueByMaster,
} from "@/lib/dispatch/dispatchHelpers"

const PAGE_SIZE = 10;

const REPORT_COLUMNS =
  "report_id, ticket_number, master_id, consumer_id, cooperative_id, status, priority, zone, barangay, municipality, nearest_landmark, created_at, updated_at, reopened_at, issue_code";
const MASTER_COLUMNS =
  "master_id, master_ticket, cooperative_id, status, priority, barangay, municipality, report_count, created_at, reopened_at";
const ASSIGNMENT_COLUMNS =
  "assignment_id, report_id, master_id, lineman_id, status, assigned_at, updated_at, completed_at";

function DispatchContent() {
  const searchParams = useSearchParams()
  // null | 'settings' | 'statusNames' | 'priorityLevels' | 'officeHours'
  const [activeModal, setActiveModal] = useState(null)
  const { isOwner } = usePermissions()
  const [reports, setReports] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [linemenNames, setLinemenNames] = useState({});
  const [clusters, setClusters] = useState([]);
  const [joinSuggestions, setJoinSuggestions] = useState([]);
  const [reopenRequests, setReopenRequests] = useState([]);
  const [masterTickets, setMasterTickets] = useState([]);
  const [recentIssueReports, setRecentIssueReports] = useState([]);
  const [masterIssues, setMasterIssues] = useState({});

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [rangeKey, setRangeKey] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Response Time Monitoring
  const [cooperativeId, setCooperativeId] = useState(null);
  const [threshold, setThreshold] = useState(30);
  const [target, setTarget] = useState(null); // resolution target, minutes (null = not set)
  const [overdueTickets, setOverdueTickets] = useState([]);
  const [shiftJobs, setShiftJobs] = useState([]);
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
    const [
      settingsRes,
      reportsRes,
      mastersRes,
      clustersRes,
      joinsRes,
      reopenRes,
      overdueRes,
      shiftJobsRes,
    ] = await Promise.all([
        supabase
          .from("cooperative_settings")
          .select("response_time_threshold_minutes, resolution_target_minutes")
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

        // Checks for jobs affected by an approaching shift end.
        supabase.rpc("check_shift_ending_jobs", { p_cooperative_id: coopId }),
      ]);

    const coop = settingsRes.data;
    if (coop?.response_time_threshold_minutes != null) {
      setThreshold(coop.response_time_threshold_minutes);
    }
    setTarget(coop?.resolution_target_minutes ?? null);

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

    if (shiftJobsRes.error) {
      setError((prev) => prev || shiftJobsRes.error.message);
    }
    setShiftJobs(shiftJobsRes.data || []);

    // Recurring issues: last 30 days of reports (including those inside Master Tickets)
    setRecentIssueReports(await loadRecentIssueReports(supabase, coopId));

    // A Master Ticket takes the most common category among its reports
    const { data: memberRows } = await supabase
      .from("reports")
      .select("master_id, issue_code")
      .eq("cooperative_id", coopId)
      .not("master_id", "is", null)
      .not("issue_code", "is", null)
      .limit(1000);
    setMasterIssues(dominantIssueByMaster(memberRows));

    setLoading(false);
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
      issue_code: masterIssues[m.master_id] || null,
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

  const term = searchText.trim().toLowerCase();
  const rangeDays = DATE_RANGES.find((r) => r.key === rangeKey)?.days;
  const since = rangeDays ? Date.now() - rangeDays * 86400000 : null;
  const municipalityOptions = Array.from(
    new Set(allTickets.map((t) => t.municipality).filter(Boolean)),
  ).sort();

  const assigneeOptions = Object.entries(linemenNames)
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const overdueIds = new Set(overdueTickets.map((o) => o.ticket_id));
  const { counts: recurringCounts } = buildRecurringGroups(recentIssueReports);

  const filtered = allTickets.filter((t) => {
    if (categoryFilter === "uncategorized") {
      if (t.issue_code) return false;
    } else if (categoryFilter !== "all" && t.issue_code !== categoryFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (statusFilter === "overdue") {
      if (!overdueIds.has(t.ticketKey)) return false;
    } else if (statusFilter !== "all" && bucketForTicket(t) !== statusFilter) return false;
    if (municipalityFilter !== "all" && t.municipality !== municipalityFilter) return false;

    if (assigneeFilter !== "all") {
      const a = t.kind === "master" ? assignmentFor(null, t.master_id) : assignmentFor(t.report_id, null);
      if (assigneeFilter === "unassigned" ? !!a : a?.lineman_id !== assigneeFilter) return false;
    }

    if (since && new Date(t.created_at).getTime() < since) return false;

    if (term) {
      const a = t.kind === "master" ? assignmentFor(null, t.master_id) : assignmentFor(t.report_id, null);
      const linemanName = a ? linemenNames[a.lineman_id] : "";
      const haystack = [t.ticket_number, t.master_ticket, t.nearest_landmark, t.barangay, t.municipality, linemanName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clusteredReportIds = new Set(
    clusters.flatMap((c) => c.report_ids || []),
  );
  const joinGroups = buildJoinGroups(joinSuggestions);

  function handleFilterChange(setter, value) {
    setter(value);
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dispatch Management</h1>
      </div>
      <DispatchModals
        active={activeModal}
        onActiveChange={setActiveModal}
        cooperativeId={cooperativeId}
        threshold={threshold}
        target={target}
        isOwner={isOwner}
        onSettingsSaved={(newThreshold, newTarget) => {
          setTarget(newTarget)
          if (newThreshold !== threshold) {
            setThreshold(newThreshold)
            loadEverything()
          }
        }}
        onPriorityLevelsSaved={() => {
          setPriorityFilter('all')
          loadEverything()
        }}
      />
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Real-time tickets monitoring and lineman coordination.
      </p>

      <DispatchAlerts
        overdueTickets={overdueTickets}
        shiftJobs={shiftJobs}
        threshold={threshold}
        reopenRequests={reopenRequests}
        clusters={clusters}
        joinGroups={joinGroups}
      />

      <DispatchStatCards
        counts={counts}
        statusFilter={statusFilter}
        onFilterChange={(value) => handleFilterChange(setStatusFilter, value)}
      />

      <DispatchFilters
        searchText={searchText}
        onSearchChange={(v) => handleFilterChange(setSearchText, v)}
        categoryFilter={categoryFilter}
        onCategoryChange={(v) => handleFilterChange(setCategoryFilter, v)}
        priorityFilter={priorityFilter}
        onPriorityChange={(v) => handleFilterChange(setPriorityFilter, v)}
        statusFilter={statusFilter}
        onStatusChange={(v) => handleFilterChange(setStatusFilter, v)}
        statusOptions={Object.keys(counts)}
        municipalityFilter={municipalityFilter}
        onMunicipalityChange={(v) => handleFilterChange(setMunicipalityFilter, v)}
        municipalityOptions={municipalityOptions}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={(v) => handleFilterChange(setAssigneeFilter, v)}
        assigneeOptions={assigneeOptions}
        rangeKey={rangeKey}
        onRangeChange={(v) => handleFilterChange(setRangeKey, v)}
        onSettings={() => setActiveModal('settings')}
      />

      <Alert>{error}</Alert>

      <DispatchTicketTable
        loading={loading}
        isEmpty={paginated.length === 0}
        footer={
          !loading && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )
        }
      >
        {paginated.map((t) => {
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
              categoryLabel={issueLabel(t.issue_code)}
              recurringCount={recurringCountFor(
                recurringCounts,
                t.issue_code,
                t.barangay,
                t.municipality,
              )}
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
      </DispatchTicketTable>
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