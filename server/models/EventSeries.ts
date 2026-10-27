import mongoose, { Types } from "mongoose";
import { TeamEventType } from "./TeamEvent";

export enum RecurrenceFrequency {
    Daily = 'daily',
    Weekly = 'weekly',
    Monthly = 'monthly'
}

export interface IRecurrenceRule {
    frequency: RecurrenceFrequency;
    // Repeat every N days / weeks / months
    interval: number;
    // Weekly only: days of week (0 = Sunday ... 6 = Saturday)
    weekdays?: number[];
    // Series ends on this local date (inclusive) ...
    until?: Date;
    // ... or after this number of occurrences
    count?: number;
}

export interface IEventSeries {
    _id?: Types.ObjectId;
    title: string;
    type: TeamEventType;
    venue?: Types.ObjectId;
    squads?: Types.ObjectId[];
    // Users invited to every occurrence
    participants?: Types.ObjectId[];
    // Local date of the first occurrence (YYYY-MM-DD) and local times (HH:mm)
    startDate: string;
    startTime: string;
    endTime: string;
    timezone: string;
    recurrence: IRecurrenceRule;
    canceledAt?: Date;
    cancelReason?: string;
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const RecurrenceRuleSchema = new mongoose.Schema<IRecurrenceRule>({
    frequency: { type: String, enum: Object.values(RecurrenceFrequency), required: true },
    interval: { type: Number, min: 1, max: 52, default: 1 },
    weekdays: [{ type: Number, min: 0, max: 6 }],
    until: { type: Date },
    count: { type: Number, min: 1 }
}, { _id: false });

const EventSeriesSchema = new mongoose.Schema<IEventSeries>({
    title: { type: String, required: true },
    type: { type: String, enum: Object.values(TeamEventType), required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    squads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Squad' }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    timezone: { type: String, required: true, default: 'Europe/Prague' },
    recurrence: { type: RecurrenceRuleSchema, required: true },
    canceledAt: { type: Date },
    cancelReason: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
    versionKey: false
});

const EventSeries = mongoose.model<IEventSeries>('EventSeries', EventSeriesSchema);
export default EventSeries;
