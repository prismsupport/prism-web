export default function SegmentedControl({ options, value, onChange, disabled }) {
  return (
    <div role="group" className="inline-flex max-w-full flex-wrap rounded-xl bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            value === o.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}