import { addMonths, addYears, format } from 'date-fns';
import type { BillingCycle } from '@/app/features/subscriptions/types';

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

// Fixed format regardless of the runtime's default locale — using
// .toLocaleDateString() directly would render differently on the server
// (often en-US, "7/18/2026") vs. a browser set to a different locale
// (e.g. "18/07/2026"), which breaks React hydration since the server-rendered
// HTML has to match the client's first render exactly.
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

interface AdvanceRenewalInput {
  billingAnchorDate: Date;
  billingCycle: BillingCycle;
  cyclesElapsed: number;
  currentRenewalDate: Date;
  currentReminderAt: Date;
  now?: Date; // injectable for testing — defaults to the real current time
}

interface AdvanceRenewalResult {
  renewalDate: Date;
  reminderAt: Date;
  cyclesElapsed: number;
}

// Moves a subscription forward to its next un-passed renewal, always computing
// from the fixed billingAnchorDate (never from currentRenewalDate) to avoid the
// month-end chaining drift described above. Loops in case multiple cycles were
// missed entirely (e.g. the cron didn't run for a while) — each pass recomputes
// from the anchor, so no drift accumulates regardless of how many cycles it
// has to jump. The user's chosen reminder lead time (however many days/hours
// before renewal they asked to be reminded) is preserved exactly, rather than
// resetting to some default.
export function advanceToNextRenewal(
  input: AdvanceRenewalInput,
): AdvanceRenewalResult {
  const now = input.now ?? new Date();
  const reminderLeadMs =
    input.currentRenewalDate.getTime() - input.currentReminderAt.getTime();

  let cyclesElapsed = input.cyclesElapsed;
  let renewalDate = input.currentRenewalDate;

  while (renewalDate.getTime() <= now.getTime()) {
    cyclesElapsed += 1;
    renewalDate = addBillingCycles(
      input.billingAnchorDate,
      input.billingCycle,
      cyclesElapsed,
    );
  }

  const reminderAt = new Date(renewalDate.getTime() - reminderLeadMs);

  return { renewalDate, reminderAt, cyclesElapsed };
}
