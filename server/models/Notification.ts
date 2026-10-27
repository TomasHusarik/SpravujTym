import mongoose, { Types } from "mongoose";

export enum NotificationType {
    EventInvited = 'event_invited',
    EventChanged = 'event_changed',
    EventCanceled = 'event_canceled',
    EventRestored = 'event_restored',
    EventDeleted = 'event_deleted',
    RsvpReminder = 'rsvp_reminder',
    PaymentCreated = 'payment_created',
    Announcement = 'announcement'
}

export interface INotification {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    type: NotificationType;
    title: string;
    message?: string;
    // Relative link in the client, e.g. /event-detail/<id>
    link?: string;
    event?: Types.ObjectId;
    readAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// In-app notifications are kept for 90 days
const NOTIFICATION_TTL_SECONDS = 90 * 24 * 60 * 60;

const NotificationSchema = new mongoose.Schema<INotification>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String },
    link: { type: String },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamEvent' },
    readAt: { type: Date }
}, {
    timestamps: true,
    versionKey: false
});

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: NOTIFICATION_TTL_SECONDS });

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
