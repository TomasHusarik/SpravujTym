import dayjs from 'dayjs';
import type { RecurrenceRule } from '@/types/EventSeries';

// Helpers for the recurrence form (RecurrenceFields)
export const MAX_OCCURRENCES = 200;

export type RecurrenceFormValue = {
    frequency: RecurrenceRule['frequency'];
    interval: number;
    weekdays: number[];
    endType: 'until' | 'count';
    until: string | null;
    count: number;
};

export const defaultRecurrence = (startDate: Date | null): RecurrenceFormValue => ({
    frequency: 'weekly',
    interval: 1,
    weekdays: [startDate ? startDate.getDay() : 1],
    endType: 'until',
    until: dayjs(startDate ?? new Date()).add(3, 'month').format('YYYY-MM-DD'),
    count: 10,
});

export const toRecurrenceRule = (value: RecurrenceFormValue): RecurrenceRule => ({
    frequency: value.frequency,
    interval: value.interval,
    weekdays: value.frequency === 'weekly' ? value.weekdays : [],
    until: value.endType === 'until' ? value.until : null,
    count: value.endType === 'count' ? value.count : null,
});

export const fromRecurrenceRule = (rule: RecurrenceRule): RecurrenceFormValue => ({
    frequency: rule.frequency,
    interval: rule.interval ?? 1,
    weekdays: rule.weekdays ?? [],
    endType: rule.count ? 'count' : 'until',
    until: rule.until ? dayjs(rule.until).format('YYYY-MM-DD') : null,
    count: rule.count ?? 10,
});

// Returns an error message or null
export const validateRecurrence = (value: RecurrenceFormValue | null, startDate: Date | null): string | null => {
    if (!value) return null;
    if (value.frequency === 'weekly' && value.weekdays.length === 0) return 'Vyberte alespoň jeden den v týdnu';
    if (value.endType === 'until') {
        if (!value.until) return 'Vyberte datum konce opakování';
        if (startDate && dayjs(value.until).isBefore(dayjs(startDate), 'day')) return 'Konec opakování musí být po začátku';
    }
    if (value.endType === 'count' && (!value.count || value.count < 1 || value.count > MAX_OCCURRENCES)) {
        return `Počet opakování musí být 1–${MAX_OCCURRENCES}`;
    }
    return null;
};
