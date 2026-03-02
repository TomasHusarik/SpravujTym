import mongoose, { Types } from "mongoose";
import { IEventParticipation } from "./EventParticipation";
import Team from "./Team";
import { ISquad } from "./Squad";

export interface ITeamEvent {
    _id?: Types.ObjectId;
    title: string;
    type: TeamEventType;
    startDate: Date;
    endDate: Date;
    venue?: Types.ObjectId;
    createdBy?: Types.ObjectId;
    participation?: IEventParticipation[];
    squads?: ISquad[];
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
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    squads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Squad' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

// Virtual relationship
TeamEventSchema.virtual('eventParticipations', {
  ref: 'EventParticipation',
  localField: '_id',
    foreignField: 'event'
});

const TeamEvent = mongoose.model("TeamEvent", TeamEventSchema);
export default TeamEvent;