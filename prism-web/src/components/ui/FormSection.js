export default function FormSection({ icon, title, children }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        {icon}
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  )
}