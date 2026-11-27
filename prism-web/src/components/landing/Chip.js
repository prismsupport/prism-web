const CHIP_TONES = {
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  gray: "bg-gray-100 text-gray-600 ring-gray-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  solid: "bg-red-600 text-white ring-red-600",
};

export function Chip({ tone = "gray", dot = false, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${CHIP_TONES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}