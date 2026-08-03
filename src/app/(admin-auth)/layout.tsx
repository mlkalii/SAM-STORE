import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "SAMRUX Admin", template: "%s — SAMRUX Admin" },
  robots: { index: false, follow: false },
};

/**
 * Bare layout for the admin sign-in flow: no sidebar, no shell chrome, dark by
 * default so the panel announces itself as a different surface from the shop.
 */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-16 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-64 -top-64 size-[42rem] rounded-full bg-gold/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-64 -left-64 size-[36rem] rounded-full bg-gold/8 blur-[120px]"
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
