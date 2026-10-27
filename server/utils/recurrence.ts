import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { IRecurrenceRule, RecurrenceFrequency } from '@models/EventSeries';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_TIMEZONE = 'Europe/Prague';
export const MAX_OCCURRENCES = 200;

const DATE_FORMAT = 'YYYY-MM-DD';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type RecurrenceInput = {
    frequency: RecurrenceFrequency | string;
    interval?: number;
    weekdays?: number[];
    until?: Date | string | null;
    count?: number | null;
};

export type SeriesSchedule = {
    // Local date of the first occurrence (YYYY-MM-DD) and local times (HH:mm)
    startDate: string;
    startTime: string;
    endTime: string;
    timezone?: string;
    recurrence: RecurrenceInput;
};

export type Occurrence = {
    // Local date of the occurrence (YYYY-MM-DD)
    date: string;
    start: Date;
    end: Date;
};

// Local date (YYYY-MM-DD) of a moment in the given timezone
export const toLocalDate = (value: Date | string, tz = DEFAULT_TIMEZONE) => {
    if (typeof value === 'string' && DATE_PATTERN.test(value)) return value;
    return dayjs(value).tz(tz).format(DATE_FORMAT);
};

// Local time (HH:mm) of a moment in the given timezone
export const toLocalTime = (value: Date | string, tz = DEFAULT_TIMEZONE) => dayjs(value).tz(tz).format('HH:mm');

// Combine a local date and local time into a Date (daylight saving time safe)
export const atLocalTime = (date: string, time: string, tz = DEFAULT_TIMEZONE) => dayjs.tz(`${date} ${time}`, tz).toDate();

// Returns an error message or null when the schedule is valid
export const validateSchedule = (schedule: SeriesSchedule): string | null => {
    const { startDate, startTime, endTime, recurrence } = schedule;

    if (!startDate || !DATE_PATTERN.test(startDate) || !dayjs(startDate, DATE_FORMAT).isValid()) return 'Invalid start date';
    if (!TIME_PATTERN.test(startTime ?? '') || !TIME_PATTERN.test(endTime ?? '')) return 'Invalid start or end time';
    if (endTime <= startTime) return 'End time must be after start time';
    if (!recurrence) return 'Recurrence rule is required';

    if (!Object.values(RecurrenceFrequency).includes(recurrence.frequency as RecurrenceFrequency)) return 'Invalid recurrence frequency';

    const interval = recurrence.interval ?? 1;
    if (!Number.isInteger(interval) || interval < 1 || interval > 52) return 'Interval must be a whole number between 1 and 52';

    if (recurrence.frequency === RecurrenceFrequency.Weekly) {
        const weekdays = recurrence.weekdays ?? [];
        if (weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) return 'Invalid weekday';
    }

    const hasUntil = recurrence.until !== undefined && recurrence.until !== null && recurrence.until !== '';
    const hasCount = recurrence.count !== undefined && recurrence.count !== null;

    if (hasUntil === hasCount) return 'Series must end either on a date or after a number of occurrences';

    if (hasCount && (!Number.isInteger(recurrence.count) || recurrence.count! < 1 || recurrence.count! > MAX_OCCURRENCES)) {
        return `Number of occurrences must be between 1 and ${MAX_OCCURRENCES}`;
    }

    if (hasUntil) {
        const until = toLocalDate(recurrence.until!, schedule.timezone ?? DEFAULT_TIMEZONE);
        if (!dayjs(until).isValid()) return 'Invalid end date';
        if (until < startDate) return 'End date must not be before the start date';
    }

    return null;
};

// Monday-based index of a weekday (Monday = 0 ... Sunday = 6)
const mondayIndex = (weekday: number) => (weekday + 6) % 7;

// Generates local dates (YYYY-MM-DD) of all occurrences of the series
export const generateOccurrenceDates = (schedule: SeriesSchedule): string[] => {
    const error = validateSchedule(schedule);
    if (error) throw new Error(error);

    const tz = schedule.timezone ?? DEFAULT_TIMEZONE;
    const { recurrence } = schedule;
    const interval = recurrence.interval ?? 1;
    const until = recurrence.until ? toLocalDate(recurrence.until, tz) : null;
    const maxCount = recurrence.count ?? MAX_OCCURRENCES;

    // Plain calendar arithmetic in UTC - local times are applied later, so DST cannot shift dates
    const first = dayjs.utc(schedule.startDate);
    const dates: string[] = [];

    const add = (date: dayjs.Dayjs) => {
        const formatted = date.format(DATE_FORMAT);
        if (until && formatted > until) return false;
        if (formatted < schedule.startDate) return true;
        dates.push(formatted);
        return dates.length < maxCount;
    };

    if (recurrence.frequency === RecurrenceFrequency.Daily) {
        for (let step = 0; dates.length < MAX_OCCURRENCES; step++) {
            if (!add(first.add(step * interval, 'day'))) break;
        }
    }

    if (recurrence.frequency === RecurrenceFrequency.Weekly) {
        const selected = recurrence.weekdays?.length ? recurrence.weekdays : [first.day()];
        const weekdays = [...new Set(selected)].sort((a, b) => mondayIndex(a) - mondayIndex(b));
        const firstMonday = first.subtract(mondayIndex(first.day()), 'day');

        weeks: for (let week = 0; dates.length < MAX_OCCURRENCES; week++) {
            const monday = firstMonday.add(week * interval, 'week');
            for (const weekday of weekdays) {
                if (!add(monday.add(mondayIndex(weekday), 'day'))) break weeks;
            }
        }
    }

    if (recurrence.frequency === RecurrenceFrequency.Monthly) {
        // Months without the given day (e.g. 31st) are skipped, like in Google Calendar
        for (let step = 0; dates.length < MAX_OCCURRENCES && step < MAX_OCCURRENCES * 2; step++) {
            const date = first.add(step * interval, 'month');
            if (date.date() !== first.date()) continue;
            if (!add(date)) break;
        }
    }

    return dates.slice(0, MAX_OCCURRENCES);
};

export const generateOccurrences = (schedule: SeriesSchedule): Occurrence[] => {
    const tz = schedule.timezone ?? DEFAULT_TIMEZONE;

    return generateOccurrenceDates(schedule).map((date) => ({
        date,
        start: atLocalTime(date, schedule.startTime, tz),
        end: atLocalTime(date, schedule.endTime, tz),
    }));
};

// The day before a local date (used when a series is split for "this and following")
export const previousDay = (date: string) => dayjs.utc(date).subtract(1, 'day').format(DATE_FORMAT);
