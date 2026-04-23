export function SheetListSkeleton() {
  return (
    <ul
      className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
      aria-busy="true"
      aria-label="Loading sheets"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="px-4 py-4 flex items-center gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-full max-w-md rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="h-5 w-5 rounded bg-gray-100 animate-pulse shrink-0" />
        </li>
      ))}
    </ul>
  );
}
