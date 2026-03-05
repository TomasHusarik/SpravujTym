import mongoose, { Types } from "mongoose";

export interface IAnnouncement {
    _id?: Types.ObjectId;
    author?: Types.ObjectId;
    title?: string;
    content?: string;
    visibility?: AnnouncementVisibility;
    pinned?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum AnnouncementVisibility {
    Public = 'public',
    Private = 'private'
}

const announcementSchema = new mongoose.Schema<IAnnouncement>({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    visibility: { type: String, enum: Object.values(AnnouncementVisibility), required: true },
    pinned: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export default Announcement;
