import { addMonths, addYears } from 'date-fns';
import type { BillingCycle } from '@/types/subscription';

// Formats a Date as the string <input type="datetime-local"> expects (local time, no timezone suffix).
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

// Default reminder: 3 days before renewal, 9am local time.
// This is only ever a starting suggestion — the user can freely override it in the form.
export function defaultReminderAt(renewalDate: Date): Date {
  const d = new Date(renewalDate);
  d.setDate(d.getDate() - 3);
  d.setHours(9, 0, 0, 0);
  return d;
}

// Adds N billing cycles to a date. Uses date-fns's addMonths/addYears, which already
// clamp correctly at month-end (Jan 31 + 1 month -> Feb 28/29, not a rollover into March).
//
// IMPORTANT: always call this with the subscription's ORIGINAL anchor date and the total
// number of cycles elapsed — never chain it by repeatedly calling addBillingCycle(lastResult, cycle)
// once per renewal. date-fns's addMonths has a known round-trip quirk (add 1 month, subtract 1
// month can lose a day on month-end dates), so incrementally stepping off the previous result
// will silently drift the renewal day over time. Computing from the fixed original date every
// time avoids that entirely.
export function addBillingCycles(
  anchorDate: Date,
  cycle: BillingCycle,
  count: number,
): Date {
  return cycle === 'yearly'
    ? addYears(anchorDate, count)
    : addMonths(anchorDate, count);
}

// Convenience wrapper for the common case: one cycle forward from the anchor date.
export function addBillingCycle(anchorDate: Date, cycle: BillingCycle): Date {
  return addBillingCycles(anchorDate, cycle, 1);
}

// Whole days between now and a given date (can be negative if already past).
export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
