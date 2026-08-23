export default function StatusDot({ isActive }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium ${
        isActive ? 'text-green-600' : 'text-gray-500'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {isActive ? 'Active' : 'Deactivated'}
    </span>
  )
}