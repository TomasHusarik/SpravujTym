import TeamEvent, { TeamEventStatus } from '@models/TeamEvent';
import { notifyRsvpReminder } from './notification.service';

const HOUR_MS = 60 * 60 * 1000;

// Players without an answer are reminded once, 24 hours before the event
export const REMINDER_BEFORE_HOURS = 24;
// Events created just before they start are not reminded (the invitation is fresh)
const MIN_EVENT_AGE_HOURS = 6;
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

// Sends automatic reminders for events starting soon; returns the number of reminded events
export const sendDueReminders = async (now = new Date()) => {
    let remindedEvents = 0;

    // Each event is claimed atomically, so a reminder is never sent twice (even with more server instances)
    while (true) {
        const event = await TeamEvent.findOneAndUpdate(
            {
                status: { $ne: TeamEventStatus.Canceled },
                startDate: { $gt: now, $lte: new Date(now.getTime() + REMINDER_BEFORE_HOURS * HOUR_MS) },
                createdAt: { $lte: new Date(now.getTime() - MIN_EVENT_AGE_HOURS * HOUR_MS) },
                reminderSentAt: { $exists: false },
            },
            { reminderSentAt: now },
            { returnDocument: 'after', sort: { startDate: 1 } }
        );

        if (!event) break;

        await notifyRsvpReminder(event._id);
        remindedEvents += 1;
    }

    return remindedEvents;
};

let running = false;

const runReminders = async () => {
    if (running) return;
    running = true;

    try {
        const count = await sendDueReminders();
        if (count > 0) console.log(`Sent RSVP reminders for ${count} event(s)`);
    } catch (error) {
        console.error('Failed to send RSVP reminders:', error);
    } finally {
        running = false;
    }
};

// In-process scheduler. On Azure App Service the "Always On" setting must be enabled,
// otherwise the app (and the scheduler) sleeps when there is no traffic.
export const startReminderScheduler = () => {
    if (process.env.NODE_ENV === 'test') return;

    setTimeout(runReminders, 60 * 1000).unref();
    setInterval(runReminders, CHECK_INTERVAL_MS).unref();
};
