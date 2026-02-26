import mongoose, { Types } from "mongoose";
import { IUser } from "./User";
import { ISquad } from "./Squad";

export enum SquadRole {
    Player = "player",
    Coach = "coach",
}

export interface ISquadMembership {
    _id?: Types.ObjectId;
    squad?: Types.ObjectId;
    user?: Types.ObjectId;
    roles?: SquadRole[];
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const SquadMembershipSchema = new mongoose.Schema<ISquadMembership>({
    squad: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roles: [{ type: String, enum: Object.values(SquadRole) }],
    active: { type: Boolean, default: true, required: true }
}, {
    timestamps: true,
    versionKey: false
});


const SquadMembership = mongoose.model("SquadMembership", SquadMembershipSchema);
export default SquadMembership;