/**
 * Date helpers for Asia/Dushanbe (+05:00)
 * We mostly store timestamps in ISO, but chips compare by *local date*.
 */

export function getDushanbeDateString(d: Date) {
  // Convert to +05:00 by adding offset diff (in minutes) from UTC
  const tzOffsetMinutes = 5 * 60;
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const local = new Date(utc + tzOffsetMinutes * 60_000);
  return local.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getDushanbeDayBounds(d: Date) {
  // build bounds at +05:00 and return ISO strings
  const day = getDushanbeDateString(d);
  const start = new Date(`${day}T00:00:00+05:00`);
  const end = new Date(`${day}T23:59:59.999+05:00`);
  return {
    date: day,
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

export function addDaysIso(startIso: string, days: number) {
  const d = new Date(startIso);
  const next = new Date(d.getTime() + days * 24 * 60 * 60_000);
  return next.toISOString();
}
