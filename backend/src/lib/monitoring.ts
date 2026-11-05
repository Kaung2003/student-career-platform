import * as Sentry from "@sentry/node";

let enabled = false;

/** Sends errors to Sentry when SENTRY_DSN is set. Without it, they only go to the server log. */
export function initMonitoring() {
  const dsn = process.env["SENTRY_DSN"];
  if (!dsn) return;
  // Request bodies and cookies stay out of reports: they can hold passwords and session tokens.
  Sentry.init({ dsn, sendDefaultPii: false, tracesSampleRate: 0, environment: process.env["NODE_ENV"] ?? "development" });
  enabled = true;
}

export function reportError(err: unknown, context: Record<string, unknown> = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      ...context,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  );
  if (enabled) {
    Sentry.captureException(err, { extra: context });
  }
}
