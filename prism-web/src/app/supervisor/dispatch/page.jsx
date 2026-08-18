"use client";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  Plus,
  Truck,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import StatCard from "@/components/ui/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatArea,
  formatTime,
  PRIORITY_LABELS,
  PRIORITY_PILL_COLORS,
  STATUS_LABELS,
} from "@/lib/reports";
import { cn } from "@/lib/utils";
import {
  getReportStatusCounts,
  getReports,
  REPORT_PRIORITIES,
  REPORT_STATUSES,
} from "@/services/reports";

const PAGE_SIZE = 6;

const columns = [
  { key: "ticket", label: "Ticket ID" },
  { key: "priority", label: "Priority" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "assignee", label: "Assignee" },
  { key: "duplicate", label: "Duplicate Match (%)" },
  { key: "actions", label: "Actions" },
];

const skeletonRowKeys = ["s1", "s2", "s3", "s4", "s5", "s6"];

// Passed to Select so the trigger shows the label while the value stays the enum.
const STATUS_FILTER_ITEMS = { all: "All Statuses", ...STATUS_LABELS };
const PRIORITY_FILTER_ITEMS = { all: "All Priorities", ...PRIORITY_LABELS };

const statCards = [
  { status: "pending", color: "text-blue-700", icon: ClipboardList },
  { status: "dispatched", color: "text-gray-900", icon: Truck },
  { status: "in_progress", color: "text-amber-600", icon: UserCog },
  { status: "qa_review", color: "text-gray-900", icon: FileCheck2 },
];

const cardStatuses = statCards.map((card) => card.status);

export default function DispatchPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [reports, setReports] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCounts = useCallback(async () => {
    try {
      const result = await getReportStatusCounts(cardStatuses);
      setCounts(result);
    } catch (err) {
      console.error("Failed to load report counts", err);
      setCounts(null);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getReports({
        status: statusFilter === "all" ? undefined : statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        page,
        pageSize: PAGE_SIZE,
      });

      setReports(result.reports);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error("Failed to load reports", err);
      setError("We couldn't load reports right now. Please try again.");
      setReports([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, page]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function handleStatusChange(value) {
    setStatusFilter(value);
    setPage(1);
  }

  function handlePriorityChange(value) {
    setPriorityFilter(value);
    setPage(1);
  }

  function handleCreateMasterTicket() {
    setNotice("Creating master tickets isn't available yet.");
  }

  function handleRetry() {
    loadCounts();
    loadReports();
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const firstVisiblePage = Math.min(
    Math.max(1, page - 1),
    Math.max(1, totalPages - 2),
  );
  const visiblePages = [
    firstVisiblePage,
    firstVisiblePage + 1,
    firstVisiblePage + 2,
  ].filter((pageNumber) => pageNumber <= totalPages);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dispatch Management</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Real-time monitoring and lineman coordination.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <StatCard
            key={card.status}
            label={STATUS_LABELS[card.status]}
            value={counts ? String(counts[card.status]).padStart(2, "0") : "–"}
            color={card.color}
            icon={card.icon}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wide text-gray-400 uppercase">
              Priority
            </span>
            <Select
              items={PRIORITY_FILTER_ITEMS}
              value={priorityFilter}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger
                aria-label="Filter by priority"
                className="w-44 h-10 rounded-lg border-gray-200 bg-white text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {REPORT_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wide text-gray-400 uppercase">
              Status
            </span>
            <Select
              items={STATUS_FILTER_ITEMS}
              value={statusFilter}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="w-44 h-10 rounded-lg border-gray-200 bg-white text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {REPORT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreateMasterTicket}
            className="ml-auto h-10 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Master Ticket
          </Button>
        </div>

        {notice && <p className="text-xs text-gray-500 mt-3">{notice}</p>}
      </div>

      {error ? (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-10 text-center">
          <p className="text-sm text-gray-700">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading &&
                skeletonRowKeys.map((rowKey) => (
                  <TableRow key={rowKey}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className="px-5 py-4">
                        <Skeleton className="h-4 w-full rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && reports.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="px-5 py-10 text-center whitespace-normal"
                  >
                    <p className="text-sm font-medium text-gray-700">
                      No reports found
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Try changing the priority or status filter.
                    </p>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                reports.map((report) => {
                  const areaText = formatArea(report);
                  const landmark = report.nearest_landmark?.trim();
                  const primaryLine =
                    landmark || areaText || "Location not set";
                  const detailLine = [
                    landmark ? areaText : "",
                    formatTime(report.created_at),
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <TableRow
                      key={report.report_id}
                      className="border-gray-100"
                    >
                      <TableCell className="px-5 py-4 font-semibold text-gray-900">
                        {report.ticket_number}
                      </TableCell>

                      <TableCell className="px-5 py-4">
                        {report.priority ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${PRIORITY_PILL_COLORS[report.priority]}`}
                          >
                            {PRIORITY_LABELS[report.priority]}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 whitespace-normal">
                        <p className="font-semibold text-gray-900">
                          {primaryLine}
                        </p>
                        {detailLine && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {detailLine}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4">
                        <StatusBadge status={STATUS_LABELS[report.status]} />
                      </TableCell>

                      <TableCell className="px-5 py-4 text-gray-400">
                        —
                      </TableCell>

                      <TableCell className="px-5 py-4 text-gray-400">
                        —
                      </TableCell>

                      <TableCell className="px-5 py-4">
                        <Link
                          href={`/supervisor/dispatch/${report.report_id}`}
                          className={cn(
                            buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            }),
                            "rounded-lg bg-blue-50 text-blue-700",
                          )}
                        >
                          Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>

          {!loading && totalCount > 0 && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} entries
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === page ? "page" : undefined}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold border ${
                      pageNumber === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
