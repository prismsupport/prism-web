export default function Logo({ subtitle, onDark = false }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/brand/mascot-sm.png" alt="" className="h-10 w-auto" />
      <div>
        <div
          className={`font-display text-lg font-extrabold leading-none tracking-tight ${
            onDark ? "text-white" : "text-blue-900"
          }`}
        >
          PRISM
        </div>
        {subtitle && (
          <div
            className={`mt-1 text-[10px] font-bold tracking-wide ${
              onDark ? "text-blue-200" : "text-gray-400"
            }`}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}