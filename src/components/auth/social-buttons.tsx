"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { socialProviders } from "@/config/auth";

/** Brand marks. Inlined because a CDN request for two icons is not worth it. */
const marks: Record<string, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M17.05 12.54c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.61-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.18-.02 1.93-1.08 2.65-2.14.83-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.31-3.52ZM14.9 5.1c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.58-2.56 1.31-.56.65-1.06 1.7-.93 2.7.97.08 1.97-.5 2.59-1.24Z" />
    </svg>
  ),
};

/**
 * Social sign-in row.
 *
 * The providers are declared in `config/auth.ts`. Until credentials exist they
 * render disabled with an explanation rather than pretending to work — the
 * callback route shape (`/api/auth/<provider>`) is already reserved.
 */
export function SocialButtons({ intent = "Sign in" }: { intent?: string }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="h-11"
          aria-label={`${intent} with ${provider.label}`}
          onClick={() => {
            if (provider.enabled) {
              window.location.href = provider.authorizeUrl;
              return;
            }
            toast("Social sign-in is not connected yet", {
              description: `Add ${provider.requiredEnv.join(", ")} to enable it.`,
            });
          }}
        >
          {marks[provider.id]}
          {provider.label}
        </Button>
      ))}
    </div>
  );
}
