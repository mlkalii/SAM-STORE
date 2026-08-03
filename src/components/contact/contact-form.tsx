"use client";

import * as React from "react";

import { contactAction } from "@/app/actions/contact";
import { CsrfField, FormBanner, SubmitButton, TextField } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { idleFormState } from "@/lib/auth/validation";

const topics = ["Order", "Warranty", "Product question", "Something else"];

export function ContactForm({ csrfToken }: { csrfToken: string }) {
  const [topic, setTopic] = React.useState(topics[0]);
  const [state, formAction] = React.useActionState(contactAction, idleFormState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-3xl">Write to us</CardTitle>
        <CardDescription>
          No ticket numbers, no chatbot. Tell us what happened and include the order number if you have one.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-5" noValidate>
          <CsrfField token={csrfToken} />
          <FormBanner state={state} />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="name"
              label="Name"
              autoComplete="name"
              placeholder="Alex Moreau"
              defaultValue={state.values?.name}
              error={state.errors?.name}
              required
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              defaultValue={state.values?.email}
              error={state.errors?.email}
              required
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Topic</span>
            <div className="flex flex-wrap gap-2">
              {topics.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={topic === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTopic(option)}
                >
                  {option}
                </Button>
              ))}
              <input type="hidden" name="topic" value={topic} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              placeholder="Order number, or just tell us what you need."
              className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {state.errors?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {state.errors.message}
              </p>
            ) : null}
          </div>

          <SubmitButton pendingLabel="Sending…">Send message</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
