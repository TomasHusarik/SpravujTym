import { Types } from 'mongoose';
import Notification, { INotification, NotificationType } from '@models/Notification';
import User from '@models/User';
import TeamEvent, { TeamEventType } from '@models/TeamEvent';
import EventParticipation, { EventParticipationStatus } from '@models/EventParticipation';
import { NotificationMail } from '@mails/NotificationMail';
import { NominationMail } from '@mails/NominationMail';
import { formatDate, formatEventDateTime } from '@utils/dates';
import { enqueueEmail } from './emailQueue';

/**
 * Notifications are always stored in-app (the bell in the header) and, for important changes,
 * also sent by e-mail to users who did not turn e-mails off.
 *
 * Only upcoming events are notified. When an action affects many occurrences of a series,
 * every user gets one summary notification instead of one per occurrence.
 */

type Id = Types.ObjectId | string;

type NotificationContent = Pick<INotification, 'type' | 'title' | 'message' | 'link'> & { event?: Id };

// `events` are the events the notification is about (used by e-mail templates)
type NotificationEntry = { userId: string; notification: NotificationContent; events?: EventSummary[] };

type EventSummary = {
    _id: Types.ObjectId;
    title: string;
    type: TeamEventType;
    startDate: Date;
    endDate: Date;
};

type EmailSender = (email: string, entry: NotificationEntry) => Promise<void>;

const sendNotificationMail: EmailSender = (email, { notification }) =>
    NotificationMail(email, { title: notification.title, message: notification.message, link: notification.link });

// Stores in-app notifications and queues e-mails for users who want them
const deliver = async (entries: NotificationEntry[], emailSender?: EmailSender) => {
    if (entries.length === 0) return;

    await Notification.insertMany(entries.map(({ userId, notification }) => ({ user: userId, ...notification })));

    if (!emailSender) return;

    const users = await User.find({
        _id: { $in: entries.map((entry) => entry.userId) },
        active: { $ne: false },
        emailNotifications: { $ne: false },
    }).select('email').lean();

    const emailByUser = new Map(users.map((user) => [String(user._id), user.email]));

    for (const entry of entries) {
        const email = emailByUser.get(entry.userId);
        if (email) enqueueEmail(() => emailSender(email, entry));
    }
};

const uniqueRecipients = (userIds: Id[], excludeUserId?: Id) =>
    [...new Set(userIds.map(String))].filter((id) => id !== String(excludeUserId ?? ''));

// Same notification for several users
export const notifyUsers = async (
    userIds: Id[],
    notification: NotificationContent,
    options: { email?: boolean; excludeUserId?: Id } = {}
) => {
    const recipients = uniqueRecipients(userIds, options.excludeUserId);
    await deliver(recipients.map((userId) => ({ userId, notification })), options.email ? sendNotificationMail : undefined);
    return recipients;
};

//#region Event helpers

const loadUpcomingEvents = async (eventIds: Id[]): Promise<EventSummary[]> => {
    if (eventIds.length === 0) return [];
    return TeamEvent.find({ _id: { $in: eventIds }, endDate: { $gte: new Date() } })
        .select('title type startDate endDate')
        .sort({ startDate: 1 })
        .lean<EventSummary[]>();
};

// userId -> events the user is invited to
const groupByParticipant = async (events: EventSummary[], onlyUserIds?: Id[]) => {
    const filter: Record<string, unknown> = { event: { $in: events.map((e) => e._id) } };
    if (onlyUserIds) filter.user = { $in: onlyUserIds };

    const participations = await EventParticipation.find(filter).select('event user').lean();
    const eventsById = new Map(events.map((event) => [String(event._id), event]));
    const byUser = new Map<string, EventSummary[]>();

    for (const participation of participations) {
        const event = eventsById.get(String(participation.event));
        if (!event) continue;
        const userId = String(participation.user);
        byUser.set(userId, [...(byUser.get(userId) ?? []), event]);
    }

    return byUser;
};

const eventLink = (event: EventSummary) => `/event-detail/${event._id}`;

// "út 27. 10. 2026 19:00–20:30" or "4× od út 27. 10. 2026 do čt 5. 11. 2026"
const describeDates = (events: EventSummary[]) => {
    if (events.length === 1) return formatEventDateTime(events[0].startDate, events[0].endDate);
    return `${events.length}× od ${formatDate(events[0].startDate)} do ${formatDate(events[events.length - 1].startDate)}`;
};

const titleFor = (prefix: string, events: EventSummary[]) =>
    events.length === 1 ? `${prefix}: ${events[0].title}` : `${prefix} (${events.length}×): ${events[0].title}`;

const buildPerUser = (
    byUser: Map<string, EventSummary[]>,
    actorId: Id | undefined,
    build: (events: EventSummary[]) => NotificationContent
): NotificationEntry[] =>
    [...byUser]
        .filter(([userId]) => userId !== String(actorId ?? ''))
        .map(([userId, events]) => ({ userId, notification: build(events), events }));

//#endregion

// New participants of events (single event or whole series). Matches send the nomination e-mail.
export const notifyInvited = async (eventIds: Id[], userIds: Id[], actorId?: Id) => {
    if (userIds.length === 0) return;

    const events = await loadUpcomingEvents(eventIds);
    if (events.length === 0) return;

    const byUser = await groupByParticipant(events, userIds);
    const entries = buildPerUser(byUser, actorId, (userEvents) => ({
        type: NotificationType.EventInvited,
        title: titleFor(userEvents[0].type === TeamEventType.Match ? 'Nominace na zápas' : 'Pozvánka', userEvents),
        message: `${describeDates(userEvents)}\nDejte prosím vědět, zda přijdete.`,
        link: eventLink(userEvents[0]),
        event: userEvents[0]._id,
    }));

    const nominations = entries.filter(({ notification }) => notification.title.startsWith('Nominace'));
    const others = entries.filter((entry) => !nominations.includes(entry));

    await deliver(others);
    await deliver(nominations, (email, { events: [event] }) =>
        NominationMail(email, { title: event.title, startDate: event.startDate, endDate: event.endDate })
    );
};

// Time, date or venue of events changed
export const notifyEventsChanged = async (eventIds: Id[], actorId?: Id, excludeUserIds: Id[] = []) => {
    const events = await loadUpcomingEvents(eventIds);
    if (events.length === 0) return;

    const byUser = await groupByParticipant(events);
    for (const userId of excludeUserIds) byUser.delete(String(userId));

    await deliver(buildPerUser(byUser, actorId, (userEvents) => ({
        type: NotificationType.EventChanged,
        title: titleFor('Změna události', userEvents),
        message: `Nový termín: ${describeDates(userEvents)}\nZkontrolujte prosím čas a místo.`,
        link: eventLink(userEvents[0]),
        event: userEvents[0]._id,
    })), sendNotificationMail);
};

export const notifyEventsCanceled = async (eventIds: Id[], actorId?: Id, reason?: string) => {
    const events = await loadUpcomingEvents(eventIds);
    if (events.length === 0) return;

    const byUser = await groupByParticipant(events);

    await deliver(buildPerUser(byUser, actorId, (userEvents) => ({
        type: NotificationType.EventCanceled,
        title: titleFor('Zrušeno', userEvents),
        message: `${describeDates(userEvents)}${reason ? `\nDůvod: ${reason}` : ''}`,
        link: eventLink(userEvents[0]),
        event: userEvents[0]._id,
    })), sendNotificationMail);
};

export const notifyEventRestored = async (eventId: Id, actorId?: Id) => {
    const events = await loadUpcomingEvents([eventId]);
    if (events.length === 0) return;

    const byUser = await groupByParticipant(events);

    await deliver(buildPerUser(byUser, actorId, (userEvents) => ({
        type: NotificationType.EventRestored,
        title: titleFor('Událost se koná', userEvents),
        message: `${describeDates(userEvents)}\nDříve zrušená událost byla obnovena.`,
        link: eventLink(userEvents[0]),
        event: userEvents[0]._id,
    })), sendNotificationMail);
};

// Deleted events no longer exist, so recipients must be collected before deleting
export const prepareDeletedNotification = async (eventIds: Id[], actorId?: Id) => {
    const events = await loadUpcomingEvents(eventIds);
    const byUser = events.length > 0 ? await groupByParticipant(events) : new Map<string, EventSummary[]>();

    const entries = buildPerUser(byUser, actorId, (userEvents) => ({
        type: NotificationType.EventDeleted,
        title: titleFor('Událost byla zrušena a odstraněna', userEvents),
        message: describeDates(userEvents),
        link: '/calendar',
    }));

    return () => deliver(entries, sendNotificationMail);
};

// Players who have not answered yet; returns the number of reminded users
export const notifyRsvpReminder = async (eventId: Id, actorId?: Id) => {
    const [event] = await loadUpcomingEvents([eventId]);
    if (!event) return 0;

    const pending = await EventParticipation.find({ event: event._id, status: EventParticipationStatus.Pending })
        .select('user')
        .lean();

    const recipients = await notifyUsers(
        pending.map((p) => p.user),
        {
            type: NotificationType.RsvpReminder,
            title: `Odpovězte prosím: ${event.title}`,
            message: `${formatEventDateTime(event.startDate, event.endDate)}\nZatím jste nedali vědět, zda přijdete.`,
            link: eventLink(event),
            event: event._id,
        },
        { email: true, excludeUserId: actorId }
    );

    return recipients.length;
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
    membership: 'Členský příspěvek',
    fines: 'Pokuta',
    other: 'Platba',
};

const formatAmount = (amount: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount);

// New payments - in-app and e-mail with the amount and due date
export const notifyPaymentsCreated = async (
    payments: { user?: Id; amount?: number; type?: string; dueDate?: Date; description?: string }[],
    actorId?: Id
) => {
    const entries: NotificationEntry[] = payments
        .filter((payment) => payment.user && String(payment.user) !== String(actorId ?? ''))
        .map((payment) => ({
            userId: String(payment.user),
            notification: {
                type: NotificationType.PaymentCreated,
                title: `Nová platba: ${formatAmount(payment.amount ?? 0)}`,
                message: `${payment.description || PAYMENT_TYPE_LABELS[payment.type ?? 'other']}\nSplatnost: ${payment.dueDate ? formatDate(payment.dueDate) : '–'}\nQR kód pro platbu najdete v aplikaci.`,
                link: '/user?tab=payments',
            },
        }));

    await deliver(entries, sendNotificationMail);
};

export const notifyAnnouncement = async (announcement: { _id?: Id; title?: string }, authorId?: Id) => {
    const users = await User.find({ active: { $ne: false }, new: { $ne: true } }).select('_id').lean();

    await notifyUsers(
        users.map((user) => user._id),
        {
            type: NotificationType.Announcement,
            title: `Nové oznámení: ${announcement.title}`,
            link: '/announcements',
        },
        { excludeUserId: authorId }
    );
};

// Notification failures must never break the main action
export const safely = async (action: () => Promise<unknown>) => {
    try {
        await action();
    } catch (error) {
        console.error('Failed to create notifications:', error);
    }
};
