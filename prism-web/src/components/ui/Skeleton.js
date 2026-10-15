export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

export function TableSkeletonRows({ rows = 5, cols = 5 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="border-b border-gray-100 last:border-0">
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c} className="px-5 py-4">
          <Skeleton className={`h-4 ${c === 0 ? "w-32" : "w-20"}`} />
        </td>
      ))}
    </tr>
  ));
}

export function PageLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}