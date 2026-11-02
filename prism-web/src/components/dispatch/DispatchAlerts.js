"use client";

import { useState } from "react";
import Link from "next/link";

const GROUPS = {
  overdue: { label: "Response Time Exceeded", badge: "bg-red-600 text-white" },
  reopen: { label: "Reopen Requests", badge: "bg-amber-100 text-amber-800" },
  clusters: { label: "Possible Duplicates", badge: "bg-blue-100 text-blue-800" },
  joins: { label: "Possible Matches", badge: "bg-purple-100 text-purple-800" },
};

function Row({ text, href, buttonLabel }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <p className="text-base text-gray-800">{text}</p>
      <Link
        href={href}
        className="whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}

// A slim summary bar. Each chip opens a short scrollable list, so alerts
// never push the ticket table off the screen.
export default function DispatchAlerts({
  overdueTickets,
  threshold,
  reopenRequests,
  clusters,
  joinGroups,
}) {
  const [open, setOpen] = useState(null);

  const counts = {
    overdue: overdueTickets.length,
    reopen: reopenRequests.length,
    clusters: clusters.length,
    joins: joinGroups.length,
  };
  const visible = Object.keys(GROUPS).filter((k) => counts[k] > 0);
  if (visible.length === 0) return null;

  const total = visible.reduce((sum, k) => sum + counts[k], 0);
  // Red when a ticket is waiting past the response time threshold, amber otherwise
  const urgent = counts.overdue > 0;

  return (
    <div
      role="alert"
      className={`mb-6 overflow-hidden rounded-xl border-2 shadow-sm ${
        urgent ? "border-red-500 bg-red-50" : "border-amber-500 bg-amber-50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none ${
                urgent ? "bg-red-500" : "bg-amber-500"
              }`}
            />
            <span
              className={`relative inline-flex h-3.5 w-3.5 rounded-full ${
                urgent ? "bg-red-600" : "bg-amber-600"
              }`}
            />
          </span>
          <div>
            <p
              className={`text-base font-extrabold tracking-wide uppercase ${
                urgent ? "text-red-700" : "text-amber-800"
              }`}
            >
              {total} {total === 1 ? "item needs" : "items need"} your attention
            </p>
            <p className="text-xs text-gray-600">Select a category below to review it.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visible.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setOpen(open === key ? null : key)}
              aria-expanded={open === key}
              className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 ${
                open === key ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-300"
              }`}
            >
              <span className={`rounded-md px-1.5 text-sm font-bold tabular-nums ${GROUPS[key].badge}`}>
                {counts[key]}
              </span>
              {GROUPS[key].label}
              <span aria-hidden="true" className="text-xs text-gray-500">
                {open === key ? "▲" : "▼"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {open && counts[open] > 0 && (
        <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto border-t-2 border-inherit bg-white">
          {open === "overdue" &&
            overdueTickets.map((o) => (
              <Row
                key={o.ticket_id}
                text={
                  <>
                    <span className="font-medium">{o.ticket_number}</span> unassigned for{" "}
                    <span className="font-semibold text-red-600">{o.minutes_elapsed} min</span>{" "}
                    (threshold: {threshold} min)
                  </>
                }
                href={
                  o.ticket_kind === "master"
                    ? `/supervisor/dispatch/master/${o.ticket_id}`
                    : `/supervisor/dispatch/report/${o.ticket_id}`
                }
                buttonLabel="Review Now"
              />
            ))}

          {open === "reopen" &&
            reopenRequests.map((r) => (
              <Row
                key={r.reopen_id}
                text={
                  <>
                    <span className="font-medium">{r.reports?.ticket_number}</span>: consumer
                    requested this resolved ticket be reopened
                  </>
                }
                href={`/supervisor/dispatch/reopen/${r.reopen_id}`}
                buttonLabel="Review Request"
              />
            ))}

          {open === "clusters" &&
            clusters.map((c) => (
              <Row
                key={c.cluster_anchor_id}
                text={
                  <>
                    <span className="font-medium text-blue-700">{c.area_label}</span>
                    {"  "}Confidence:{" "}
                    <span className="font-semibold text-green-600">{c.confidence}%</span>
                    {"  "}Related reports: <span className="font-semibold">{c.related_count}</span>
                  </>
                }
                href={`/supervisor/dispatch/cluster/${c.cluster_anchor_id}`}
                buttonLabel="Review Cluster"
              />
            ))}

          {open === "joins" &&
            joinGroups.map((g) => (
              <Row
                key={`${g.target_type}-${g.target_id}`}
                text={
                  <>
                    {g.reportIds.length} report{g.reportIds.length === 1 ? "" : "s"} may belong to{" "}
                    <span className="font-medium text-purple-700">{g.target_label}</span>
                    {"  "}Best match:{" "}
                    <span className="font-semibold text-green-600">{g.maxScore}%</span>
                  </>
                }
                href={`/supervisor/dispatch/join-group/${g.target_type}/${g.target_id}?reports=${g.reportIds.join(",")}`}
                buttonLabel="Review Matches"
              />
            ))}
        </div>
      )}
    </div>
  );
}