import mongoose, { Types } from "mongoose";
import { ILeague } from "./League";


export interface ISquad {
    _id?: Types.ObjectId;
    name?: string;
    league?: ILeague;
    teamId?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const SquadSchema = new mongoose.Schema<ISquad>({
    name: { type: String, required: true },
    league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
}, {
    timestamps: true
});

// Virtual relationship
SquadSchema.virtual('memberships', {
    ref: 'SquadMembership',
    localField: '_id',
    foreignField: 'squad'
});

const Squad = mongoose.model<ISquad>("Squad", SquadSchema);
export default Squad;
