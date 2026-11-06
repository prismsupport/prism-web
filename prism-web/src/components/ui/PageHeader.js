export default function PageHeader({ title, description, actions, className = '' }) {
  if (!actions) {
    return (
      <>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1 mb-6">{description}</p>}
      </>
    )
  }

  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {actions}
    </div>
  )
}