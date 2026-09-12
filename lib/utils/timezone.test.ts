import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_HOUR,
  formatInTimeZone,
  isValidTimeZone,
  reminderInstantFor,
  timeZoneOffsetMs,
  zonedTimeToUtc,
} from './timezone';

const HOUR = 60 * 60 * 1000;

describe('isValidTimeZone', () => {
  it('accepts real IANA names', () => {
    for (const tz of [
      'UTC',
      'Africa/Lagos',
      'America/New_York',
      'Asia/Tokyo',
      'Australia/Sydney',
    ]) {
      expect(isValidTimeZone(tz)).toBe(true);
    }
  });

  it('rejects anything else, since this value is client-supplied', () => {
    for (const tz of [
      '',
      'Not/AZone',
      'Mars/Olympus_Mons',
      'DROP TABLE profiles',
      '../../etc/passwd',
    ]) {
      expect(isValidTimeZone(tz)).toBe(false);
    }
  });

  it('does not throw on non-string input', () => {
    expect(isValidTimeZone(undefined as unknown as string)).toBe(false);
    expect(isValidTimeZone(null as unknown as string)).toBe(false);
  });
});

describe('timeZoneOffsetMs', () => {
  it('is zero for UTC', () => {
    expect(timeZoneOffsetMs(new Date('2026-01-15T12:00:00Z'), 'UTC')).toBe(0);
  });

  it('is a constant +1 for Lagos, which has no DST', () => {
    expect(
      timeZoneOffsetMs(new Date('2026-01-15T12:00:00Z'), 'Africa/Lagos'),
    ).toBe(1 * HOUR);
    expect(
      timeZoneOffsetMs(new Date('2026-07-15T12:00:00Z'), 'Africa/Lagos'),
    ).toBe(1 * HOUR);
  });

  it('tracks DST in New York', () => {
    // EST in January, EDT in July - the whole reason a fixed offset is wrong.
    expect(
      timeZoneOffsetMs(new Date('2026-01-15T12:00:00Z'), 'America/New_York'),
    ).toBe(-5 * HOUR);
    expect(
      timeZoneOffsetMs(new Date('2026-07-15T12:00:00Z'), 'America/New_York'),
    ).toBe(-4 * HOUR);
  });

  it('handles a zone with a half-hour offset', () => {
    expect(
      timeZoneOffsetMs(new Date('2026-01-15T12:00:00Z'), 'Asia/Kolkata'),
    ).toBe(5.5 * HOUR);
  });

  it('handles midnight, where some ICU builds report hour 24', () => {
    expect(timeZoneOffsetMs(new Date('2026-01-15T00:00:00Z'), 'UTC')).toBe(0);
  });
});

describe('zonedTimeToUtc', () => {
  it('round-trips: the instant reads back as the wall-clock time asked for', () => {
    for (const tz of [
      'UTC',
      'Africa/Lagos',
      'America/New_York',
      'America/Los_Angeles',
      'Asia/Tokyo',
      'Asia/Kolkata',
      'Australia/Sydney',
      'Pacific/Kiritimati',
    ]) {
      const instant = zonedTimeToUtc(
        { year: 2026, month: 3, day: 18, hour: 9, minute: 0 },
        tz,
      );
      expect(formatInTimeZone(instant, tz)).toBe('2026-03-18, 09:00');
    }
  });

  it('resolves correctly on both sides of a DST transition', () => {
    // US DST starts 2026-03-08. 9am on the 7th is EST, on the 9th is EDT.
    const before = zonedTimeToUtc(
      { year: 2026, month: 3, day: 7, hour: 9 },
      'America/New_York',
    );
    const after = zonedTimeToUtc(
      { year: 2026, month: 3, day: 9, hour: 9 },
      'America/New_York',
    );

    expect(before.toISOString()).toBe('2026-03-07T14:00:00.000Z'); // UTC-5
    expect(after.toISOString()).toBe('2026-03-09T13:00:00.000Z'); // UTC-4

    // Both still read as 9am locally, which is the point.
    expect(formatInTimeZone(before, 'America/New_York')).toBe(
      '2026-03-07, 09:00',
    );
    expect(formatInTimeZone(after, 'America/New_York')).toBe(
      '2026-03-09, 09:00',
    );
  });

  it('handles a southern-hemisphere transition too', () => {
    // Sydney runs DST in the opposite half of the year.
    const jan = zonedTimeToUtc(
      { year: 2026, month: 1, day: 15, hour: 9 },
      'Australia/Sydney',
    );
    const jul = zonedTimeToUtc(
      { year: 2026, month: 7, day: 15, hour: 9 },
      'Australia/Sydney',
    );
    expect(formatInTimeZone(jan, 'Australia/Sydney')).toBe('2026-01-15, 09:00');
    expect(formatInTimeZone(jul, 'Australia/Sydney')).toBe('2026-07-15, 09:00');
    // Same wall-clock hour, different UTC instants.
    expect(jan.getUTCHours()).not.toBe(jul.getUTCHours());
  });
});

describe('reminderInstantFor', () => {
  it('lands on 9am local, three days before renewal, in every zone', () => {
    for (const tz of [
      'UTC',
      'Africa/Lagos',
      'America/New_York',
      'America/Los_Angeles',
      'Asia/Tokyo',
      'Asia/Kolkata',
    ]) {
      const at = reminderInstantFor('2026-10-01', tz);
      expect(formatInTimeZone(at, tz)).toBe('2026-09-28, 09:00');
    }
  });

  it('is the fix for the reported defect', () => {
    // Before: reminder_at was computed with setHours(9) on a UTC server, so it
    // was 09:00Z for everyone - 05:00 in New York and 02:00 in Los Angeles.
    const naiveUtc = new Date('2026-09-28T09:00:00.000Z');
    expect(formatInTimeZone(naiveUtc, 'America/Los_Angeles')).toBe(
      '2026-09-28, 02:00',
    );

    // After: an actual 9am for that user.
    const fixed = reminderInstantFor('2026-10-01', 'America/Los_Angeles');
    expect(formatInTimeZone(fixed, 'America/Los_Angeles')).toBe(
      '2026-09-28, 09:00',
    );
  });

  it('steps back across a month boundary', () => {
    const at = reminderInstantFor('2026-03-02', 'Africa/Lagos');
    expect(formatInTimeZone(at, 'Africa/Lagos')).toBe('2026-02-27, 09:00');
  });

  it('steps back across a year boundary', () => {
    const at = reminderInstantFor('2026-01-02', 'Africa/Lagos');
    expect(formatInTimeZone(at, 'Africa/Lagos')).toBe('2025-12-30, 09:00');
  });

  it('handles a leap day', () => {
    const at = reminderInstantFor('2028-03-02', 'UTC');
    expect(formatInTimeZone(at, 'UTC')).toBe('2028-02-28, 09:00');
  });

  it('honours a custom lead time and hour', () => {
    const at = reminderInstantFor('2026-10-01', 'Asia/Tokyo', 7, 18);
    expect(formatInTimeZone(at, 'Asia/Tokyo')).toBe('2026-09-24, 18:00');
  });

  it('falls back to UTC on a bad zone instead of throwing', () => {
    const at = reminderInstantFor('2026-10-01', 'Not/AZone');
    expect(formatInTimeZone(at, 'UTC')).toBe('2026-09-28, 09:00');
  });

  it('rejects a malformed date rather than silently guessing', () => {
    expect(() => reminderInstantFor('01/10/2026', 'UTC')).toThrow();
  });

  it('uses 9am as the documented default hour', () => {
    expect(DEFAULT_REMINDER_HOUR).toBe(9);
  });
});
