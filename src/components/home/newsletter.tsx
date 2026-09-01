"use client";

import { Check, Send } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Newsletter() {
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);

  // No backend yet — this stands in for the eventual subscribe endpoint.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDone(true);
    toast.success("You're on the list", { description: `We'll write to ${email} rarely.` });
  }

  return (
    <Container as="section" className="py-24">
      <Reveal className="relative overflow-hidden rounded-3xl border border-gold/25 bg-surface px-6 py-16 shadow-premium sm:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-[26rem] rounded-full bg-gold/12 blur-3xl"
        />
        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
              Restock & deals
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Six emails a year. <em className="text-gold-gradient italic">Maybe five.</em>
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Price drops and restocks across all fourteen departments. Subscribers see them a day early.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="newsletter-email" className="sr-only">
                Email address
              </Label>
              <Input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 bg-background"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6">
              {done ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              {done ? "Subscribed" : "Subscribe"}
            </Button>
          </form>
        </div>
      </Reveal>
    </Container>
  );
}
