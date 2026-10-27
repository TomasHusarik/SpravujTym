import mongoose, { Types } from "mongoose";
import { IUser } from "./User";
import { ISquad } from "./Squad";

export enum SquadRole {
    Player = "player",
    Coach = "coach",
}

export enum PlayerPosition {
    Goalkeeper = "goalkeeper",
    Defender = "defender",
    Forward = "forward",
}

export interface ISquadMembership {
    _id?: Types.ObjectId;
    squad?: Types.ObjectId;
    user?: Types.ObjectId;
    roles?: SquadRole[];
    position?: PlayerPosition;
    jerseyNumber?: number;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const SquadMembershipSchema = new mongoose.Schema<ISquadMembership>({
    squad: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roles: [{ type: String, enum: Object.values(SquadRole) }],
    position: { type: String, enum: Object.values(PlayerPosition) },
    jerseyNumber: { type: Number, min: 0, max: 99 },
    active: { type: Boolean, default: true, required: true }
}, {
    timestamps: true,
    versionKey: false
});


const SquadMembership = mongoose.model("SquadMembership", SquadMembershipSchema);
export default SquadMembership;