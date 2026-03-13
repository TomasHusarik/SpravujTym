import mongoose, { Types } from "mongoose";

export interface IComment {
    _id?: Types.ObjectId;
    author?: Types.ObjectId;
    event?: Types.ObjectId;
    content?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ComentSchema = new mongoose.Schema<IComment>({
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
        content: { type: String, required: true }
}, {
    timestamps: true
});

const Comment = mongoose.model<IComment>('Commnet', ComentSchema);
export default Comment;
