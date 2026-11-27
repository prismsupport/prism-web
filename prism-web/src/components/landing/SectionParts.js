import { Icon } from "@/components/landing/Icon";

export function SectionHeading({ id, eyebrow, title, text, className = "" }) {
  return (
    <div className={`max-w-none ${className}`}>
      <p className="flex items-center gap-3 text-xs font-bold tracking-wide text-blue-700">
        <span className="h-px w-8 bg-blue-700" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 id={id} className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#022b67] sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-3 text-base leading-relaxed text-gray-500">{text}</p>}
    </div>
  );
}

export function GroupHeader({ group }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-gray-200 pt-6">
      <span className="font-display text-sm font-bold text-blue-700">{group.n}</span>
      <h3 className="font-display text-xl font-bold text-[#022b67]">{group.title}</h3>
      <p className="text-sm text-gray-500 sm:ml-auto sm:text-right sm:whitespace-nowrap">
        {group.text}
      </p>
    </div>
  );
}

export function RoleList({ points, dark = false }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {points.map((p) => (
        <li key={p} className={`flex items-start gap-2.5 text-sm ${dark ? "text-blue-100/80" : "text-gray-600"}`}>
          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${dark ? "bg-amber-300/20 text-amber-300" : "bg-blue-100 text-blue-700"}`}>
            <Icon name="tick" className="h-2.5 w-2.5" />
          </span>
          {p}
        </li>
      ))}
    </ul>
  );
}