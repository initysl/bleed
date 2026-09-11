import { describe, expect, it } from 'vitest';
import {
  addBillingCycles,
  advanceToNextRenewal,
  daysUntil,
  defaultReminderAt,
  formatDateOnly,
  parseDateOnly,
} from './dates';

// Every date-only value goes through the same local-calendar parse/format pair
// the application uses. Using new Date('YYYY-MM-DD') and .toISOString() here
// instead would make the suite pass only in UTC and Africa/Lagos — which is
// exactly the bug these helpers exist to prevent.
const iso = formatDateOnly;
const d = parseDateOnly;

describe('addBillingCycles', () => {
  it('clamps month-end dates rather than rolling into the next month', () => {
    // Jan 31 + 1 month is Feb 28, not Mar 3.
    expect(iso(addBillingCycles(d('2025-01-31'), 'monthly', 1))).toBe(
      '2025-02-28',
    );
  });

  it('clamps to Feb 29 in a leap year', () => {
    expect(iso(addBillingCycles(d('2024-01-31'), 'monthly', 1))).toBe(
      '2024-02-29',
    );
  });

  it('recovers the original day-of-month on later cycles', () => {
    // This is the whole reason the anchor exists. Computed from the anchor,
    // cycle 2 off Jan 31 is Mar 31 — the day survives February. Chaining
    // (Jan 31 -> Feb 28 -> Mar 28) would have silently lost three days and
    // kept losing them.
    const anchor = d('2025-01-31');
    expect(iso(addBillingCycles(anchor, 'monthly', 2))).toBe('2025-03-31');
    expect(iso(addBillingCycles(anchor, 'monthly', 3))).toBe('2025-04-30');
    expect(iso(addBillingCycles(anchor, 'monthly', 4))).toBe('2025-05-31');
  });

  it('handles a Feb 29 yearly anchor in a non-leap year', () => {
    expect(iso(addBillingCycles(d('2024-02-29'), 'yearly', 1))).toBe(
      '2025-02-28',
    );
    // And returns to the 29th when a leap year comes round again.
    expect(iso(addBillingCycles(d('2024-02-29'), 'yearly', 4))).toBe(
      '2028-02-29',
    );
  });
});

describe('advanceToNextRenewal', () => {
  it('moves a passed renewal forward exactly one cycle', () => {
    const result = advanceToNextRenewal({
      billingAnchorDate: d('2025-01-15'),
      billingCycle: 'monthly',
      cyclesElapsed: 0,
      currentRenewalDate: d('2025-01-15'),
      currentReminderAt: new Date('2025-01-12T09:00:00Z'),
      now: new Date('2025-01-16T00:30:00Z'),
    });

    expect(iso(result.renewalDate)).toBe('2025-02-15');
    expect(result.cyclesElapsed).toBe(1);
  });

  it('preserves the user’s chosen reminder lead time', () => {
    // Reminder set ~10 days ahead, not the 3-day default — advancing must not
    // quietly reset it to the default.
    //
    // Asserted as "the lead is unchanged" rather than against a hardcoded
    // number of milliseconds: the renewal is a local calendar day and the
    // reminder is an absolute instant, so the gap between them legitimately
    // differs by the UTC offset. Preservation is the actual contract.
    const renewal = d('2025-01-15');
    const reminder = new Date('2025-01-05T09:00:00Z');
    const originalLeadMs = renewal.getTime() - reminder.getTime();

    const result = advanceToNextRenewal({
      billingAnchorDate: d('2025-01-15'),
      billingCycle: 'monthly',
      cyclesElapsed: 0,
      currentRenewalDate: renewal,
      currentReminderAt: reminder,
      now: new Date('2025-01-16T00:00:00Z'),
    });

    expect(result.renewalDate.getTime() - result.reminderAt.getTime()).toBe(
      originalLeadMs,
    );
    // And it is genuinely the user's ~10 days, not the 3-day default.
    expect(originalLeadMs / (24 * 60 * 60 * 1000)).toBeGreaterThan(9);
  });

  it('catches up across several missed cycles without drifting', () => {
    // The cron didn't run for four months. Each pass recomputes from the
    // anchor, so the 31st is still the 31st at the end of it.
    const result = advanceToNextRenewal({
      billingAnchorDate: d('2025-01-31'),
      billingCycle: 'monthly',
      cyclesElapsed: 0,
      currentRenewalDate: d('2025-01-31'),
      currentReminderAt: new Date('2025-01-28T09:00:00Z'),
      now: new Date('2025-05-02T00:00:00Z'),
    });

    expect(iso(result.renewalDate)).toBe('2025-05-31');
    expect(result.cyclesElapsed).toBe(4);
  });

  it('always lands strictly in the future', () => {
    const now = new Date('2026-09-11T12:00:00Z');
    const result = advanceToNextRenewal({
      billingAnchorDate: d('2020-03-15'),
      billingCycle: 'monthly',
      cyclesElapsed: 0,
      currentRenewalDate: d('2020-03-15'),
      currentReminderAt: new Date('2020-03-12T09:00:00Z'),
      now,
    });

    expect(result.renewalDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it('advances a yearly subscription by a year', () => {
    const result = advanceToNextRenewal({
      billingAnchorDate: d('2024-06-01'),
      billingCycle: 'yearly',
      cyclesElapsed: 0,
      currentRenewalDate: d('2024-06-01'),
      currentReminderAt: new Date('2024-05-29T09:00:00Z'),
      now: new Date('2024-06-02T00:00:00Z'),
    });

    expect(iso(result.renewalDate)).toBe('2025-06-01');
    expect(result.cyclesElapsed).toBe(1);
  });
});

describe('defaultReminderAt', () => {
  it('is three days before renewal at 9am local time', () => {
    const reminder = defaultReminderAt(d('2025-07-20'));
    expect(iso(reminder)).toBe('2025-07-17');
    expect(reminder.getHours()).toBe(9);
  });

  it('crosses a month boundary correctly', () => {
    expect(iso(defaultReminderAt(d('2025-07-02')))).toBe(
      '2025-06-29',
    );
  });
});

describe('daysUntil', () => {
  it('returns 0 for today and a negative number for the past', () => {
    const today = new Date();
    expect(daysUntil(today.toISOString())).toBe(0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(daysUntil(yesterday.toISOString())).toBe(-1);
  });

  it('is unaffected by the time of day on either side', () => {
    const target = new Date();
    target.setDate(target.getDate() + 3);
    target.setHours(23, 59, 0, 0);
    expect(daysUntil(target.toISOString())).toBe(3);
  });
});

describe('parseDateOnly / formatDateOnly', () => {
  it('round-trips a date-only string in any timezone', () => {
    for (const s of ['2025-01-31', '2024-02-29', '2025-12-31', '2025-03-09']) {
      expect(formatDateOnly(parseDateOnly(s))).toBe(s);
    }
  });

  it('reads a date-only string as the LOCAL calendar day', () => {
    // The regression this guards: new Date('2025-01-31') is UTC midnight, which
    // is Jan 30 in every timezone west of Greenwich, so getDate() disagreed
    // with the string the database returned.
    const parsed = parseDateOnly('2025-01-31');
    expect(parsed.getFullYear()).toBe(2025);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(31);
  });

  it('leaves a full timestamp alone', () => {
    // reminder_at is a timestamptz — a real instant, not a calendar day, and it
    // must keep normal Date parsing.
    const ts = '2025-01-31T09:00:00.000Z';
    expect(parseDateOnly(ts).toISOString()).toBe(ts);
  });
});

describe('formatDate', () => {
  it('shows the stored calendar day, not a UTC-shifted one', async () => {
    const { formatDate } = await import('./dates');
    expect(formatDate('2025-01-31')).toBe('Jan 31, 2025');
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
  });
});
