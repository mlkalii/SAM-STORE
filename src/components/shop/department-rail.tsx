import Link from "next/link";

import { CategoryIcon } from "@/components/common/category-icon";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

/**
 * Horizontal department strip. Scrolls on small screens rather than wrapping
 * into a wall of chips.
 */
export function DepartmentRail({
  activeSlug,
  className,
}: {
  activeSlug?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Departments"
      className={cn("-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0", className)}
    >
      <ul className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
        {categories.map((category) => {
          const active = category.slug === activeSlug;
          return (
            <li key={category.slug}>
              <Link
                href={`/categories/${category.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-muted",
                )}
              >
                <CategoryIcon name={category.icon} className="size-4 shrink-0" />
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
