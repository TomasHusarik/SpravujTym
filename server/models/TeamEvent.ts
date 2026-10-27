import mongoose, { Types } from "mongoose";
import { IEventParticipation } from "./EventParticipation";
import { ISquad } from "./Squad";

export interface ITeamEvent {
    _id?: Types.ObjectId;
    title: string;
    type: TeamEventType;
    status?: TeamEventStatus;
    startDate: Date;
    endDate: Date;
    venue?: Types.ObjectId;
    createdBy?: Types.ObjectId;
    participation?: IEventParticipation[];
    squads?: ISquad[];
    // Recurring events: the series and the originally planned start of this occurrence
    series?: Types.ObjectId;
    originalStart?: Date;
    // Occurrence was edited on its own ("only this event")
    isException?: boolean;
    cancelReason?: string;
    canceledAt?: Date;
    canceledBy?: Types.ObjectId;
    // Automatic reminder to players without an answer / last manual reminder by a coach
    reminderSentAt?: Date;
    manualReminderAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum TeamEventType {
    Training = 'training',
    Match = 'match',
    Other = 'other'
}

export enum TeamEventStatus {
    Scheduled = 'scheduled',
    Canceled = 'canceled'
}

const TeamEventSchema = new mongoose.Schema<ITeamEvent>({
    title: { type: String, required: true },
    type: { type: String, enum: Object.values(TeamEventType), required: true },
    status: { type: String, enum: Object.values(TeamEventStatus), default: TeamEventStatus.Scheduled },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    squads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Squad' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    series: { type: mongoose.Schema.Types.ObjectId, ref: 'EventSeries' },
    originalStart: { type: Date },
    isException: { type: Boolean, default: false },
    cancelReason: { type: String, trim: true },
    canceledAt: { type: Date },
    canceledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reminderSentAt: { type: Date },
    manualReminderAt: { type: Date }
}, {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

TeamEventSchema.index({ startDate: 1 });
TeamEventSchema.index({ squads: 1, startDate: 1 });
TeamEventSchema.index({ series: 1, originalStart: 1 });

// Virtual relationship
TeamEventSchema.virtual('eventParticipations', {
  ref: 'EventParticipation',
  localField: '_id',
    foreignField: 'event'
});

const TeamEvent = mongoose.model("TeamEvent", TeamEventSchema);
export default TeamEvent;
