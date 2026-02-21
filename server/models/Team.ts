import mongoose, { Types } from "mongoose";

export interface ITeam { 
    id?: Types.ObjectId;
    name?: string;
    shortName?: string;
    homeCity?: string;
    foundedYear?: number;
    bankAccount?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const teamEventSchema = new mongoose.Schema<ITeam>({
    name: { type: String, required: true },
    shortName: { type: String },
    homeCity: { type: String },
    foundedYear: { type: Number },
    bankAccount: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<ITeam>('Team', teamEventSchema);
