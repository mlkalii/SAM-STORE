import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Mirrors `ProductGrid` exactly so the swap to real content does not shift layout. */
export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="mt-4 h-3 w-16" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-3 h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Sidebar filters placeholder for the listing pages. */
export function FilterPanelSkeleton() {
  return (
    <div className="hidden space-y-6 lg:block" aria-hidden>
      {Array.from({ length: 4 }).map((_, group) => (
        <div key={group}>
          <Skeleton className="h-3 w-24" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }).map((_, row) => (
              <Skeleton key={row} className="h-6 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
