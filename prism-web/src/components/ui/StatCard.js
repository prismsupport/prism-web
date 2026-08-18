export default function StatCard({
  label,
  value,
  color = "text-gray-900",
  icon: Icon,
  isActive,
  onClick,
}) {
  const clickable = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`text-left bg-white rounded-xl border p-5 transition-all cursor-pointer ${
        isActive
          ? "border-blue-600 ring-1 ring-blue-600"
          : "border-gray-200 hover:border-gray-300"
      } ${!clickable ? "cursor-default" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
            {label}
          </p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>

        {Icon && (
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Icon className="w-[18px] h-[18px]" />
          </span>
        )}
      </div>
    </button>
  );
}
