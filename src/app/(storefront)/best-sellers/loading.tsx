import { Container } from "@/components/common/container";
import { FilterPanelSkeleton, ProductGridSkeleton } from "@/components/skeletons/product-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-14">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-12 w-72" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />

      <div className="mt-10 flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-36 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
        <FilterPanelSkeleton />
        <div>
          <div className="flex items-center justify-between border-b pb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-36" />
          </div>
          <ProductGridSkeleton className="mt-8" count={8} />
        </div>
      </div>
    </Container>
  );
}
