"use client";

import * as React from "react";

/**
 * The current date, but only once the client has hydrated.
 *
 * Server-rendered (and prerendered) markup must not contain "today", or a page
 * cached at build time would show a stale delivery date forever. This returns
 * `null` during SSR and hydration, then the real date — via
 * `useSyncExternalStore`, so there is no setState-in-effect.
 */

const subscribe = () => () => {};

// Resolved once per page load; delivery estimates do not need minute accuracy.
let cached: Date | null = null;
function getSnapshot() {
  if (!cached) cached = new Date();
  return cached;
}
const getServerSnapshot = () => null;

export function useClientToday(): Date | null {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
