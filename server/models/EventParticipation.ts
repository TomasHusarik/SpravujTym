import mongoose, { Types } from "mongoose";

export interface IEventParticipation {
    _id?: Types.ObjectId;
    event?: Types.ObjectId;
    user?: Types.ObjectId;
    status?: EventParticipationStatus;
    note?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum EventParticipationStatus {
    Confirmed = 'confirmed',
    Declined = 'declined',
    Maybe = 'maybe',
    Pending = 'pending'
}

export const PARTICIPATION_NOTE_MAX_LENGTH = 200;

const ParticipationSchema = new mongoose.Schema<IEventParticipation>({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamEvent', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(EventParticipationStatus), default: EventParticipationStatus.Pending },
    // Optional reason, e.g. why the player declined
    note: { type: String, trim: true, maxlength: PARTICIPATION_NOTE_MAX_LENGTH }
}, {
    timestamps: true,
    versionKey: false
});

ParticipationSchema.index(
  { event: 1, user: 1 },
  { unique: true }
);

ParticipationSchema.index({ user: 1 });


export default mongoose.model<IEventParticipation>('EventParticipation', ParticipationSchema);
