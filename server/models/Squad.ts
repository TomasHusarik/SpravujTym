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

const squadSchema = new mongoose.Schema<ISquad>({
    name: { type: String, required: true },
    league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
}, {
    timestamps: true
});

const Squad = mongoose.model<ISquad>("Squad", squadSchema);
export default Squad;
