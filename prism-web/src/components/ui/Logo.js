export default function Logo({ subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          className="w-5 h-5"
        >
          <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
        </svg>
      </div>
      <div>
        <div className="font-extrabold tracking-tight text-gray-900 leading-none">
          PRISM
        </div>
        {subtitle && (
          <div className="text-[10px] font-bold tracking-wide text-gray-400 mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}