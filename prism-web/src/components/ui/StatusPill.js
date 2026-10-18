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
};

function labelize(value) {
  return String(value)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Colour for a priority level from its position in the list (rank 1 = lowest)
function priorityTone(rank, count) {
  if (!rank || !count) return "gray";
  if (count === 1) return "blue";
  const position = (rank - 1) / (count - 1); // 0 = lowest, 1 = highest
  if (position >= 1) return "solid";
  if (position >= 0.6) return "red";
  if (position >= 0.3) return "amber";
  return "blue";
}

function Pill({ tone, text }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}

// Also used by the Priority Levels dialog for its live preview
export function PriorityPill({ label, rank, count }) {
  return <Pill tone={TONES[priorityTone(rank, count)]} text={label} />;
}

// status: the key that decides the colour. label: optional text override.
// labelOf: show the name of a different status code than the one that sets the colour.
export default function StatusPill({ status, label, labelOf, kind }) {
  const { labels, priorityLevels } = useStatusLabels();
  const empty = !status;

  if (kind === "priority") {
    const level = empty ? null : priorityLevels.find((l) => l.key === status);
    const tone = TONES[level ? priorityTone(level.rank, priorityLevels.length) : "gray"];
    const text = label || (empty ? "None" : level ? level.label : labelize(status));
    return <Pill tone={tone} text={text} />;
  }

  const key = empty ? "" : String(status).toLowerCase();
  const labelCode = String(labelOf || status || "").toLowerCase();
  const tone = TONES[empty ? "gray" : STATUS_TONE[key] || "gray"];
  const custom = kind !== "coop" ? labels[labelCode] : undefined;
  const text = label || (empty ? "—" : custom || labelize(labelOf || status));
  return <Pill tone={tone} text={text} />;
}