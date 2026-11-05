const TONES = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  gray: "bg-gray-100 text-gray-600",
};

// compact: smaller padding, value and icon, so more cards fit above the fold.
export default function MetricCard({ label, value, hint, tone = "blue", compact = false, children }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl ${TONES[tone]} ${
            compact ? "h-7 w-7" : "h-9 w-9"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={compact ? "h-4 w-4" : "h-5 w-5"}
          >
            {children}
          </svg>
        </span>
      </div>
      <p
        className={`font-display font-extrabold tabular-nums text-gray-900 ${
          compact ? "mt-1.5 text-2xl" : "mt-3 text-3xl"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}