import mongoose, { Types } from "mongoose";

export interface IAnnouncement {
    _id?: Types.ObjectId;
    teamId?: Types.ObjectId;
    authorId?: Types.ObjectId;
    title?: string;
    content?: string;
    visibility?: AnnouncementVisibility;
    pinned?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum AnnouncementVisibility {
    Public = 'public',
    TeamOnly = 'team_only'
}

const announcementSchema = new mongoose.Schema<IAnnouncement>({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    visibility: { type: String, enum: Object.values(AnnouncementVisibility), default: AnnouncementVisibility.TeamOnly },
    pinned: { type: Boolean, default: false }
}, {
    timestamps: true
});

export default mongoose.model<IAnnouncement>('Announcement', announcementSchema);