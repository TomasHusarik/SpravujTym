export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceRule {
    frequency: RecurrenceFrequency;
    // Repeat every N days / weeks / months
    interval: number;
    // Weekly only: days of week (0 = Sunday ... 6 = Saturday)
    weekdays?: number[];
    // Series ends on this date (inclusive) or after `count` occurrences
    until?: string | null;
    count?: number | null;
}

export interface EventSeries {
    _id?: string;
    startDate?: string;
    startTime?: string;
    endTime?: string;
    recurrence?: RecurrenceRule;
    canceledAt?: Date;
    cancelReason?: string;
}

// Which occurrences of a series an edit / cancel / delete applies to
export type EditScope = 'this' | 'following' | 'all';
