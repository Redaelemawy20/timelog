import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SheetListSkeleton() {
  return (
    <Card
      className="overflow-hidden gap-0 py-0 shadow-sm"
      aria-busy="true"
      aria-label="Loading sheets"
    >
      <ul className="divide-y divide-border">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 max-w-md" />
            </div>
            <Skeleton className="size-5 shrink-0 rounded" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
