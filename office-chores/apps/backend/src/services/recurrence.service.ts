/**
 * Pure functions for computing recurrence occurrence dates.
 * No database access — fully unit-testable.
 */

export interface RecurrenceOptions {
  intervalWeeks: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startDate: Date;
  endDate?: Date | null;
}

/**
 * Returns the first occurrence on or after `from` that matches the
 * given day-of-week, aligned to the startDate anchor.
 */
function firstOccurrenceOnOrAfter(options: RecurrenceOptions, from: Date): Date | null {
  const { intervalWeeks, dayOfWeek, startDate, endDate } = options;
  const intervalMs = intervalWeeks * 7 * 24 * 60 * 60 * 1000;

  // Normalize to midnight UTC
  const anchor = new Date(startDate);
  anchor.setUTCHours(0, 0, 0, 0);

  const fromNorm = new Date(from);
  fromNorm.setUTCHours(0, 0, 0, 0);

  // Find the first anchor-aligned date that has the correct dayOfWeek.
  // The anchor itself must be on the correct dayOfWeek (enforced at creation time),
  // but if not, we advance to the first valid day.
  let current = new Date(anchor);
  while (current.getUTCDay() !== dayOfWeek) {
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  // If current is before from, advance by intervalWeeks until >= from
  while (current < fromNorm) {
    current = new Date(current.getTime() + intervalMs);
  }

  if (endDate && current > endDate) return null;
  return current;
}

/**
 * Returns all occurrence dates within [windowStart, windowEnd] for the given recurrence rule.
 */
export function getOccurrencesInWindow(
  options: RecurrenceOptions,
  windowStart: Date,
  windowEnd: Date
): Date[] {
  const { intervalWeeks, endDate } = options;
  const intervalMs = intervalWeeks * 7 * 24 * 60 * 60 * 1000;

  const first = firstOccurrenceOnOrAfter(options, windowStart);
  if (!first) return [];

  const results: Date[] = [];
  let current = first;

  while (current <= windowEnd) {
    if (endDate && current > endDate) break;
    results.push(new Date(current));
    current = new Date(current.getTime() + intervalMs);
  }

  return results;
}

/**
 * Returns the next N occurrence dates starting from `after`.
 * Used for the recurrence preview endpoint.
 */
export function getNextNOccurrences(
  options: RecurrenceOptions,
  after: Date,
  n: number
): Date[] {
  const { intervalWeeks, endDate } = options;
  const intervalMs = intervalWeeks * 7 * 24 * 60 * 60 * 1000;

  const first = firstOccurrenceOnOrAfter(options, after);
  if (!first) return [];

  const results: Date[] = [];
  let current = first;

  while (results.length < n) {
    if (endDate && current > endDate) break;
    results.push(new Date(current));
    current = new Date(current.getTime() + intervalMs);
  }

  return results;
}
