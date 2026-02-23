import mongoose, { Types } from "mongoose";

export interface IEventParticipation {
    _id?: Types.ObjectId;
    eventId?: Types.ObjectId;
    userId?: Types.ObjectId;
    status?: EventParticipationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum EventParticipationStatus {
    Confirmed = 'confirmed',
    Declined = 'declined',
    Pending = 'pending'
}

const ParticipationSchema = new mongoose.Schema<IEventParticipation>({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamEvent', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(EventParticipationStatus), default: EventParticipationStatus.Pending }
}, {
    timestamps: true,
    versionKey: false
});

ParticipationSchema.index(
  { eventId: 1, userId: 1 },
  { unique: true }
);


export default mongoose.model<IEventParticipation>('EventParticipation', ParticipationSchema);