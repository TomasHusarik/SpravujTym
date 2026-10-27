import { RecurrenceFrequency } from '../models/EventSeries';
import {
  MAX_OCCURRENCES,
  generateOccurrenceDates,
  generateOccurrences,
  previousDay,
  toLocalDate,
  validateSchedule,
} from '../utils/recurrence';

const weekly = (overrides: Record<string, unknown> = {}) => ({
  startDate: '2026-10-27', // Tuesday
  startTime: '19:00',
  endTime: '20:30',
  recurrence: { frequency: RecurrenceFrequency.Weekly, interval: 1, weekdays: [2, 4], count: 4 },
  ...overrides,
});

describe('validateSchedule', () => {
  it('accepts a valid weekly schedule', () => {
    expect(validateSchedule(weekly())).toBeNull();
  });

  it('requires exactly one of until / count', () => {
    expect(validateSchedule(weekly({ recurrence: { frequency: 'weekly', interval: 1 } }))).not.toBeNull();
    expect(
      validateSchedule(weekly({ recurrence: { frequency: 'weekly', interval: 1, count: 3, until: '2026-12-01' } }))
    ).not.toBeNull();
  });

  it('rejects an end time before the start time', () => {
    expect(validateSchedule(weekly({ startTime: '20:00', endTime: '19:00' }))).toMatch(/End time/);
  });

  it('rejects an end date before the start date', () => {
    expect(validateSchedule(weekly({ recurrence: { frequency: 'weekly', until: '2026-10-01' } }))).toMatch(/End date/);
  });

  it('rejects an invalid interval, frequency and too many occurrences', () => {
    expect(validateSchedule(weekly({ recurrence: { frequency: 'weekly', interval: 0, count: 2 } }))).not.toBeNull();
    expect(validateSchedule(weekly({ recurrence: { frequency: 'yearly', count: 2 } }))).not.toBeNull();
    expect(validateSchedule(weekly({ recurrence: { frequency: 'daily', count: MAX_OCCURRENCES + 1 } }))).not.toBeNull();
  });
});

describe('generateOccurrenceDates', () => {
  it('repeats daily every N days until a date (inclusive)', () => {
    const dates = generateOccurrenceDates({
      startDate: '2026-11-01',
      startTime: '10:00',
      endTime: '11:00',
      recurrence: { frequency: RecurrenceFrequency.Daily, interval: 2, until: '2026-11-07' },
    });

    expect(dates).toEqual(['2026-11-01', '2026-11-03', '2026-11-05', '2026-11-07']);
  });

  it('repeats weekly on chosen days and stops after N occurrences', () => {
    expect(generateOccurrenceDates(weekly())).toEqual(['2026-10-27', '2026-10-29', '2026-11-03', '2026-11-05']);
  });

  it('skips chosen weekdays that fall before the start date in the first week', () => {
    // Start on Thursday, repeat on Monday and Thursday
    const dates = generateOccurrenceDates(weekly({
      startDate: '2026-10-29',
      recurrence: { frequency: RecurrenceFrequency.Weekly, weekdays: [1, 4], count: 3 },
    }));

    expect(dates).toEqual(['2026-10-29', '2026-11-02', '2026-11-05']);
  });

  it('repeats every second week', () => {
    const dates = generateOccurrenceDates(weekly({
      recurrence: { frequency: RecurrenceFrequency.Weekly, interval: 2, weekdays: [2], until: '2026-12-01' },
    }));

    expect(dates).toEqual(['2026-10-27', '2026-11-10', '2026-11-24']);
  });

  it('uses the weekday of the start date when no weekdays are given', () => {
    const dates = generateOccurrenceDates(weekly({
      recurrence: { frequency: RecurrenceFrequency.Weekly, count: 2 },
    }));

    expect(dates).toEqual(['2026-10-27', '2026-11-03']);
  });

  it('repeats monthly on the same day and skips months without that day', () => {
    const dates = generateOccurrenceDates({
      startDate: '2026-01-31',
      startTime: '18:00',
      endTime: '19:00',
      recurrence: { frequency: RecurrenceFrequency.Monthly, interval: 1, count: 4 },
    });

    expect(dates).toEqual(['2026-01-31', '2026-03-31', '2026-05-31', '2026-07-31']);
  });

  it('never generates more than the maximum number of occurrences', () => {
    const dates = generateOccurrenceDates({
      startDate: '2026-01-01',
      startTime: '18:00',
      endTime: '19:00',
      recurrence: { frequency: RecurrenceFrequency.Daily, until: '2030-01-01' },
    });

    expect(dates).toHaveLength(MAX_OCCURRENCES);
  });
});

describe('generateOccurrences', () => {
  it('keeps the local time across the daylight saving time change', () => {
    // DST in Europe/Prague ends on 25 Oct 2026
    const occurrences = generateOccurrences({
      startDate: '2026-10-20',
      startTime: '19:00',
      endTime: '20:30',
      recurrence: { frequency: RecurrenceFrequency.Weekly, weekdays: [2], count: 2 },
    });

    expect(occurrences[0].start.toISOString()).toBe('2026-10-20T17:00:00.000Z'); // CEST, UTC+2
    expect(occurrences[1].start.toISOString()).toBe('2026-10-27T18:00:00.000Z'); // CET, UTC+1
    expect(occurrences[1].end.toISOString()).toBe('2026-10-27T19:30:00.000Z');
  });
});

describe('date helpers', () => {
  it('converts a moment to the local Prague date', () => {
    expect(toLocalDate(new Date('2026-10-27T23:30:00.000Z'))).toBe('2026-10-28');
  });

  it('returns the previous calendar day', () => {
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
  });
});
