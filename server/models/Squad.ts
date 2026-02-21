import mongoose, { Types } from "mongoose";

export interface ISquad { 
    id?: Types.ObjectId;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const squadSchema = new mongoose.Schema<ISquad>({
    name: { type: String, required: true }
}, {
    timestamps: true
});

export default mongoose.model<ISquad>('Squad', squadSchema);
