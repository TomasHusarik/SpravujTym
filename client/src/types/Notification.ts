export type NotificationType =
    | 'event_invited'
    | 'event_changed'
    | 'event_canceled'
    | 'event_restored'
    | 'event_deleted'
    | 'rsvp_reminder'
    | 'payment_created'
    | 'announcement';

export interface AppNotification {
    _id: string;
    type: NotificationType;
    title: string;
    message?: string;
    // Relative link in the app, e.g. /event-detail/<id>
    link?: string;
    event?: string;
    readAt?: string;
    createdAt: string;
}
