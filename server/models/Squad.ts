import mongoose, { Types } from "mongoose";
import { ILeague } from "./League";
import { ITeam } from "./Team";

export interface ISquad { 
    _id?: Types.ObjectId;
    name?: string;
    league?: ILeague;
    team?: ITeam;
    createdAt?: Date;
    updatedAt?: Date;
}

const squadSchema = new mongoose.Schema<ISquad>({
    name: { type: String, required: true },
    league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true }
}, {
    timestamps: true
});

const Squad = mongoose.model<ISquad>("Squad", squadSchema);
export default Squad;
