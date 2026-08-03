import { Sparkles } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

export function AnnouncementBar() {
  return (
    // `dark` scopes the chrome palette to this strip only.
    <div className="dark border-b border-white/10 bg-background text-foreground">
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-5 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:px-8">
        <Sparkles className="size-3.5 text-gold" aria-hidden />
        Free shipping over {formatPrice(siteConfig.freeShippingThreshold)} · 30-day returns · Warranty handled in-house
      </p>
    </div>
  );
}
