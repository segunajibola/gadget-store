/**
 * Date helpers in Lagos time (WAT = UTC+1, no daylight saving).
 * Servers (Vercel) run in UTC, so "today" must be computed explicitly.
 */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export type Period = "day" | "week" | "month";

/** Start of the current Lagos day / week (Monday) / month, as a UTC Date. */
export function lagosPeriodStart(period: Period, now = new Date()): Date {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS); // read with UTC getters = Lagos wall clock
  const y = lagos.getUTCFullYear();
  const m = lagos.getUTCMonth();
  let d = lagos.getUTCDate();
  if (period === "month") d = 1;
  if (period === "week") d -= (lagos.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(y, m, d) - LAGOS_OFFSET_MS);
}

const dateTimeFmt = new Intl.DateTimeFormat("en-NG", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** "15 Nov, 2:30 pm" in Lagos time */
export function formatLagosDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}
