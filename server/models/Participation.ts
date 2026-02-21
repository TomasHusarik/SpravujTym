import mongoose, { Types } from "mongoose";

export interface IParticipation {
    id?: Types.ObjectId;
    eventId?: Types.ObjectId;
    userId?: Types.ObjectId;
    status?: ParticipationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum ParticipationStatus {
    Confirmed = 'confirmed',
    Declined = 'declined',
    Pending = 'pending'
}

const ParticipationSchema = new mongoose.Schema<IParticipation>({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamEvent', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(ParticipationStatus), default: ParticipationStatus.Pending }
}, {
    timestamps: true
});

ParticipationSchema.index(
  { eventId: 1, userId: 1 },
  { unique: true }
);


export default mongoose.model<IParticipation>('Participation', ParticipationSchema);