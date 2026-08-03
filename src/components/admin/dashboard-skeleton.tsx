import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading placeholder — heading, stat row, table.
 *
 * Used by the `loading.tsx` of the dashboard list routes. Those live in an
 * `(index)` route group so the Suspense boundary wraps only the list itself:
 * a boundary that also covered `orders/[id]` would flush a 200 before the
 * detail page could call `notFound()`, turning every unknown id into a soft
 * 404. Renders inside the admin/seller shell, so the sidebar and top bar stay
 * interactive while the list resolves.
 */
export function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>

      <Skeleton className="mt-4 h-96 rounded-xl" />
    </div>
  );
}

export default DashboardSkeleton;
