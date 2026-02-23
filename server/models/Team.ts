import mongoose, { Types } from "mongoose";
import { IVenue } from "./Venue";

export interface ITeam { 
    _id?: Types.ObjectId;
    name?: string;
    shortName?: string;
    city?: string;
    venue?: IVenue;
    foundedYear?: number;
    bankAccount?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const TeamSchema = new mongoose.Schema<ITeam>({
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    city: { type: String, required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    foundedYear: { type: Number },
    bankAccount: { type: String }
}, {
    timestamps: true
});

// Virtual relationship
TeamSchema.virtual('squads', {
  ref: 'Squad',
  localField: '_id',
  foreignField: 'team'
});

const Team = mongoose.model<ITeam>("Team", TeamSchema);
export default Team;