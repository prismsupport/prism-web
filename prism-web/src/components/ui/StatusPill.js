"use client";

import { useStatusLabels } from "@/lib/workflow/StatusLabelsContext";

const TONES = {
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  gray: "bg-gray-100 text-gray-600 ring-gray-200",
  solid: "bg-red-600 text-white ring-red-600",
};

const STATUS_TONE = {
  // tickets
  pending: "red", dispatched: "amber", in_progress: "orange",
  qa_review: "blue", resolved: "green", cancelled: "gray",
  // job orders
  assigned: "gray", on_the_way: "amber", arrived_at_site: "amber", fixed: "blue",
  // cooperatives
  active: "green", "pending approval": "red", rejected: "amber", deactivated: "gray",
  // advisories
  upcoming: "amber", completed: "gray",
  // priorities
  low: "blue", medium: "amber", high: "red", critical: "solid",
};

function labelize(value) {
  return String(value)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// status: the key that decides the colour. label: optional text override.
export default function StatusPill({ status, label, labelOf, kind }) {
  const { labels } = useStatusLabels();
  const empty = !status;
  const key = empty ? "" : String(status).toLowerCase();
  const tone = TONES[empty ? "gray" : STATUS_TONE[key] || "gray"];
  const labelCode = String(labelOf || status || "").toLowerCase();
  const useCustom = kind !== "priority" && kind !== "coop";
  const text =
    label ||
    (empty
      ? kind === "priority"
        ? "None"
        : "—"
      : (useCustom && labels[labelCode]) || labelize(labelOf || status));
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}