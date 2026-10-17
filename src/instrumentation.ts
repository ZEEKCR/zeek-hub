import * as Sentry from "@sentry/nextjs";

function scrub(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\+?\d[\d\s()-]{7,}\d/g, "[redacted-phone]");
}

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    beforeSend(event) {
      if (event.message) event.message = scrub(event.message);
      return event;
    },
  });
}
