export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <img src="/brand/mascot-sm.png" alt="" className="h-16 w-auto" />
      <p className="mt-4 text-sm font-semibold text-gray-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}