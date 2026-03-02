import mongoose, { Types } from "mongoose";

export interface IEventParticipation {
    _id?: Types.ObjectId;
    event?: Types.ObjectId;
    user?: Types.ObjectId;
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
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamEvent', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(EventParticipationStatus), default: EventParticipationStatus.Pending }
}, {
    timestamps: true,
    versionKey: false
});

ParticipationSchema.index(
  { event: 1, user: 1 },
  { unique: true }
);


export default mongoose.model<IEventParticipation>('EventParticipation', ParticipationSchema);