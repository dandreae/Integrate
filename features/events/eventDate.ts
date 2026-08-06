const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Days between "today" and the event's date (negative if in the past). event.date is "YYYY-MM-DD". */
export function daysUntilEvent(isoDate: string, now: Date = new Date()): number {
  const eventDay = startOfDay(new Date(`${isoDate}T00:00:00`));
  const today = startOfDay(now);
  return Math.round((eventDay.getTime() - today.getTime()) / DAY_MS);
}

export function isPastEvent(isoDate: string, now: Date = new Date()): boolean {
  return daysUntilEvent(isoDate, now) < 0;
}

/** "Today", "Tomorrow", "In 3 days", or a plain date once it's far enough out. */
export function formatRelativeEventDate(isoDate: string, now: Date = new Date()): string {
  const days = daysUntilEvent(isoDate, now);
  if (days < 0) return "Past event";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 6) return `In ${days} days`;
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
