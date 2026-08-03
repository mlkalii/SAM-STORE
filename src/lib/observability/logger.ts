/**
 * Structured logger.
 *
 * One line of JSON per event so any collector — Vercel drains, CloudWatch,
 * Datadog, Axiom — can index it without a parser. In development it prints a
 * readable line instead.
 *
 * Levels follow syslog intuition: `debug` is developer noise, `info` is
 * business events (order placed, webhook received), `warn` is something a
 * human should glance at, `error` is something a human must act on.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const configured = (process.env.LOG_LEVEL as Level) ?? "info";
const threshold = LEVEL_RANK[configured] ?? 20;
const pretty = process.env.NODE_ENV !== "production";

function emit(level: Level, event: string, fields: Record<string, unknown>) {
  if (LEVEL_RANK[level] < threshold) return;

  if (pretty) {
    const extras = Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : "";
    console[level === "debug" ? "log" : level](`[${level}] ${event}${extras}`);
    return;
  }

  console.log(
    JSON.stringify({ level, event, time: new Date().toISOString(), ...fields }),
  );
}

export const logger = {
  debug: (event: string, fields: Record<string, unknown> = {}) => emit("debug", event, fields),
  info: (event: string, fields: Record<string, unknown> = {}) => emit("info", event, fields),
  warn: (event: string, fields: Record<string, unknown> = {}) => emit("warn", event, fields),
  error: (event: string, fields: Record<string, unknown> = {}) => emit("error", event, fields),
};
