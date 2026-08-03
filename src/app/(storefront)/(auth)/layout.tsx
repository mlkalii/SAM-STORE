import { Container } from "@/components/common/container";

/**
 * Auth pages sit on a soft grey canvas with a gold wash — quieter than the
 * storefront so the form is the only thing competing for attention.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-64 -top-64 size-[46rem] rounded-full bg-gold/12 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-64 -left-64 size-[38rem] rounded-full bg-gold/8 blur-[120px]"
      />

      <Container className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center py-16">
        {children}
      </Container>
    </div>
  );
}
