// Converting a wall-clock time in a named zone to a real instant.
//
// Reminder times are chosen as a wall-clock intent - "three days before it
// renews, at 9am" - but stored as a timestamptz, which is an absolute instant.
// Turning the first into the second needs the user's zone, and the offset is
// not a constant: America/New_York is -05:00 in January and -04:00 in July.
//
// Node has full ICU, so Intl does the actual work here; date-fns-tz would add a
// dependency for two functions.

export const DEFAULT_TIME_ZONE = 'UTC';

// The hour reminders default to, in the user's own local time.
export const DEFAULT_REMINDER_HOUR = 9;

/**
 * Is this a real IANA zone name?
 *
 * The value arrives from `Intl.DateTimeFormat().resolvedOptions().timeZone` in
 * a browser, which means it is client-supplied and must not be trusted. An
 * unchecked value would be written to the database and then thrown by every
 * later DateTimeFormat that reads it.
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone || typeof timeZone !== 'string') return false;

  try {
    // Throws RangeError on an unknown zone.
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * How far ahead of UTC `timeZone` is at this particular instant, in ms.
 * Positive east of Greenwich. Accounts for DST because it asks about a
 * specific instant rather than the zone in the abstract.
 */
export function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');

  // Some ICU versions render midnight as hour 24 under hour12:false.
  const hour = get('hour') % 24;

  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second'),
  );

  // Millisecond precision is irrelevant here and formatToParts drops it, so
  // compare against the instant floored to the second.
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The UTC instant at which the clock in `timeZone` reads the given wall-clock
 * time.
 */
export function zonedTimeToUtc(
  wall: {
    year: number;
    month: number; // 1-12
    day: number;
    hour?: number;
    minute?: number;
  },
  timeZone: string,
): Date {
  const naive = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour ?? 0,
    wall.minute ?? 0,
  );

  // Guess using the offset in force at the naive instant, then re-check using
  // the offset at the answer. The two differ only near a DST transition, where
  // the first guess can land on the wrong side of the boundary; one correction
  // is enough, because a transition never moves the clock by more than the
  // gap between the two candidate offsets.
  const firstGuess = new Date(
    naive - timeZoneOffsetMs(new Date(naive), timeZone),
  );
  const corrected = new Date(naive - timeZoneOffsetMs(firstGuess, timeZone));

  return corrected;
}

/**
 * When to remind someone about a renewal: `daysBefore` days earlier, at `hour`
 * o'clock in their own zone.
 *
 * Falls back to UTC rather than throwing on an unrecognised zone - a stale or
 * malformed profile value should give a slightly-off reminder, not break
 * ingestion for that user entirely.
 */
export function reminderInstantFor(
  renewalDate: string, // "YYYY-MM-DD"
  timeZone: string,
  daysBefore = 3,
  hour = DEFAULT_REMINDER_HOUR,
): Date {
  const zone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(renewalDate);
  if (!match) {
    throw new Error(
      `reminderInstantFor: expected YYYY-MM-DD, got "${renewalDate}"`,
    );
  }

  // Step back the requested number of days on the calendar first, in UTC, so
  // the arithmetic is plain and unaffected by any zone. Only the final
  // wall-clock-to-instant conversion is zone-aware.
  const shifted = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  shifted.setUTCDate(shifted.getUTCDate() - daysBefore);

  return zonedTimeToUtc(
    {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour,
      minute: 0,
    },
    zone,
  );
}

/** What the clock reads in `timeZone` at this instant - for display and tests. */
export function formatInTimeZone(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(instant);
}
