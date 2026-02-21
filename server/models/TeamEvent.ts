import mongoose, { Types } from "mongoose";
import { IParticipation } from "./Participation";

export interface ITeamEvent {
    _id?: Types.ObjectId;
    title: string;
    type: TeamEventType;
    startDate: Date;
    endDate: Date;
    venueId?: Types.ObjectId;
    createdBy?: Types.ObjectId;
    participation?: IParticipation[];
    createdAt?: Date;
    updatedAt?: Date;
}

export enum TeamEventType {
    Training = 'training',
    Match = 'match',
    Other = 'other'
}

const TeamEventSchema = new mongoose.Schema<ITeamEvent>({
    title: { type: String, required: true },
    type: { type: String, enum: Object.values(TeamEventType), required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

// Virtual relationship
TeamEventSchema.virtual('participation', {
    ref: 'Participation',
    localField: '_id',
    foreignField: 'eventId',
});

export default mongoose.model<ITeamEvent>('TeamEvent', TeamEventSchema);