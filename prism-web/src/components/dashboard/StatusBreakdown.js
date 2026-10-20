import Link from "next/link";

const BAR = {
  pending: "bg-red-500",
  dispatched: "bg-amber-400",
  in_progress: "bg-orange-500",
  qa_review: "bg-blue-600",
  resolved: "bg-green-500",
  cancelled: "bg-gray-300",
};

export default function StatusBreakdown({ cards, counts }) {
  const total = cards.reduce((n, s) => n + (counts[s.key] || 0), 0);

  return (
    <div>
      <div className="mb-5 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        {total > 0 &&
          cards.map(
            (s) =>
              (counts[s.key] || 0) > 0 && (
                <div
                  key={s.key}
                  title={`${s.label}: ${counts[s.key]}`}
                  className={BAR[s.key] || "bg-gray-300"}
                  style={{ width: `${(counts[s.key] / total) * 100}%` }}
                />
              )
          )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cards.map((s) => (
          <Link
            key={s.key}
            href={`/supervisor/dispatch?status=${s.key}`}
            className="rounded-xl border border-gray-100 p-3 transition-colors hover:border-gray-200 hover:bg-gray-50"
          >
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`h-2 w-2 rounded-full bg-current ${s.color}`} />
              {s.label}
            </p>
            <p className="font-display mt-1 text-2xl font-extrabold tabular-nums text-gray-900">
              {counts[s.key] || 0}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}