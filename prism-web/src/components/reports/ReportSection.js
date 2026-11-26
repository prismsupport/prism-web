export default function ReportSection({ title, description, children, className = '' }) {
  return (
    <section
      className={`flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {description && <p className="mb-4 mt-1 text-xs text-gray-400">{description}</p>}
      {!description && <div className="mb-4" />}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  )
}