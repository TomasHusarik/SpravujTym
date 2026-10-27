jest.mock('@middleware/auth.middleware', () => require('./helpers/mockAuth'));

import request from 'supertest';
import app from '../server';
import TeamEvent, { TeamEventStatus, TeamEventType } from '../models/TeamEvent';
import EventParticipation, { EventParticipationStatus } from '../models/EventParticipation';
import Notification, { NotificationType } from '../models/Notification';
import { SquadRole } from '../models/SquadMembership';
import User from '../models/User';
import { mailer } from '../services/mailer';
import { NominationMail } from '../mails/NominationMail';
import { drainEmailQueue } from '../services/emailQueue';
import { sendDueReminders } from '../services/reminder.service';
import { createTestUser } from './factories/userFactory';
import { addTestMembership, createTestSquad } from './factories/squadFactory';

const HOUR = 60 * 60 * 1000;
const asUser = (userId: { toString(): string }) => ({ 'x-test-user-id': userId.toString() });
const mailerMock = mailer as jest.MockedFunction<typeof mailer>;

const sentTo = () => mailerMock.mock.calls.map(([email]) => email.to);

const setup = async () => {
  const { user: coach } = await createTestUser();
  const { user: player1 } = await createTestUser();
  const { user: player2 } = await createTestUser();
  await User.updateOne({ _id: player2._id }, { emailNotifications: false });
  const { squad } = await createTestSquad();

  await addTestMembership(coach._id, squad._id, [SquadRole.Coach]);
  await addTestMembership(player1._id, squad._id, [SquadRole.Player]);
  await addTestMembership(player2._id, squad._id, [SquadRole.Player]);

  return { coach, player1, player2, squad };
};

const createEvent = async (
  coachId: { toString(): string },
  squadId: string,
  options: { type?: TeamEventType; startInHours?: number; recurrence?: Record<string, unknown> } = {}
) => {
  const start = new Date(Date.now() + (options.startInHours ?? 72) * HOUR);
  const response = await request(app)
    .post('/api/team-event/create-team-event')
    .set(asUser(coachId))
    .send({
      title: 'Training',
      type: options.type ?? TeamEventType.Training,
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 1.5 * HOUR).toISOString(),
      squads: [squadId],
      recurrence: options.recurrence,
    });

  expect(response.status).toBe(201);
  return response.body;
};

beforeEach(() => {
  mailerMock.mockClear();
});

describe('Invitations', () => {
  it('invites players in-app without e-mail for a training and never notifies the author', async () => {
    const { coach, player1, player2, squad } = await setup();
    await createEvent(coach._id, squad._id.toString());
    await drainEmailQueue();

    const notifications = await Notification.find({ type: NotificationType.EventInvited }).lean();
    expect(notifications.map((n) => String(n.user)).sort()).toEqual([player1._id.toString(), player2._id.toString()].sort());
    expect(notifications[0].title).toBe('Pozvánka: Training');
    expect(mailerMock).not.toHaveBeenCalled();
  });

  it('sends one summary invitation per player for a whole series', async () => {
    const { coach, player1, squad } = await setup();
    await createEvent(coach._id, squad._id.toString(), {
      recurrence: { frequency: 'daily', interval: 7, count: 4 },
    });

    const notifications = await Notification.find({ user: player1._id }).lean();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('Pozvánka (4×): Training');
  });

  it('sends the nomination e-mail for a match only to players who want e-mails', async () => {
    const { coach, player1, squad } = await setup();
    await createEvent(coach._id, squad._id.toString(), { type: TeamEventType.Match });
    await drainEmailQueue();

    const nominationMock = NominationMail as jest.MockedFunction<typeof NominationMail>;
    expect(nominationMock.mock.calls.map(([email]) => email)).toEqual([player1.email]);
    expect(nominationMock.mock.calls[0][1]).toEqual(expect.objectContaining({ title: 'Training' }));
  });
});

describe('Event changes', () => {
  it('notifies participants about a canceled series once, by e-mail and in-app', async () => {
    const { coach, player1, player2, squad } = await setup();
    const { seriesId } = await createEvent(coach._id, squad._id.toString(), {
      recurrence: { frequency: 'daily', interval: 7, count: 3 },
    });
    const [first] = await TeamEvent.find({ series: seriesId }).sort({ startDate: 1 });
    await Notification.deleteMany({});

    await request(app)
      .post(`/api/team-event/cancel-event/${first._id}`)
      .set(asUser(coach._id))
      .send({ scope: 'all', reason: 'Hall closed' });
    await drainEmailQueue();

    const notifications = await Notification.find({ type: NotificationType.EventCanceled }).lean();
    expect(notifications).toHaveLength(2);
    expect(notifications[0].title).toBe('Zrušeno (3×): Training');
    expect(notifications[0].message).toContain('Důvod: Hall closed');
    expect(notifications.some((n) => String(n.user) === coach._id.toString())).toBe(false);

    // player2 turned e-mails off
    expect(sentTo()).toEqual([player1.email]);
    expect(String(notifications.find((n) => String(n.user) === player2._id.toString())?.user)).toBe(player2._id.toString());
  });

  it('does not notify about events that already took place', async () => {
    const { coach, player1, squad } = await setup();
    const event = await TeamEvent.create({
      title: 'Old training',
      type: TeamEventType.Training,
      startDate: new Date(Date.now() - 48 * HOUR),
      endDate: new Date(Date.now() - 47 * HOUR),
      squads: [squad._id],
      createdBy: coach._id,
    });
    await EventParticipation.create({ event: event._id, user: player1._id });

    await request(app).post(`/api/team-event/cancel-event/${event._id}`).set(asUser(coach._id)).send({});

    expect(await Notification.countDocuments()).toBe(0);
  });

  it('notifies existing participants about a new time and invites new ones', async () => {
    const { coach, player1, squad } = await setup();
    const { user: newPlayer } = await createTestUser();
    const { eventId } = await createEvent(coach._id, squad._id.toString());
    await Notification.deleteMany({});

    const event = await TeamEvent.findById(eventId).lean();
    const newStart = new Date(event!.startDate.getTime() + HOUR);

    const response = await request(app)
      .put(`/api/team-event/update-event/${eventId}`)
      .set(asUser(coach._id))
      .send({
        title: 'Training',
        type: TeamEventType.Training,
        startDate: newStart.toISOString(),
        endDate: new Date(newStart.getTime() + HOUR).toISOString(),
        squads: [squad._id.toString()],
        participations: [{ userId: player1._id.toString() }, { userId: newPlayer._id.toString() }],
      });

    expect(response.status).toBe(200);

    const changed = await Notification.find({ type: NotificationType.EventChanged }).lean();
    const invited = await Notification.find({ type: NotificationType.EventInvited }).lean();
    expect(changed.map((n) => String(n.user))).toEqual([player1._id.toString()]);
    expect(invited.map((n) => String(n.user))).toEqual([newPlayer._id.toString()]);
  });

  it('notifies participants when an event is restored or deleted', async () => {
    const { coach, player1, squad } = await setup();
    const { eventId } = await createEvent(coach._id, squad._id.toString());

    await request(app).post(`/api/team-event/cancel-event/${eventId}`).set(asUser(coach._id)).send({});
    await request(app).post(`/api/team-event/restore-event/${eventId}`).set(asUser(coach._id));
    await request(app).delete(`/api/team-event/delete-event/${eventId}`).set(asUser(coach._id));

    const types = (await Notification.find({ user: player1._id }).sort({ createdAt: 1 }).lean()).map((n) => n.type);
    expect(types).toEqual([
      NotificationType.EventInvited,
      NotificationType.EventCanceled,
      NotificationType.EventRestored,
      NotificationType.EventDeleted,
    ]);
  });
});

describe('RSVP reminders', () => {
  it('reminds only players without an answer, only once and not for canceled events', async () => {
    const { coach, player1, player2, squad } = await setup();
    const { eventId } = await createEvent(coach._id, squad._id.toString(), { startInHours: 30 });
    const { eventId: canceledId } = await createEvent(coach._id, squad._id.toString(), { startInHours: 30 });
    await TeamEvent.updateOne({ _id: canceledId }, { status: TeamEventStatus.Canceled });
    await EventParticipation.updateOne({ event: eventId, user: player2._id }, { status: EventParticipationStatus.Confirmed });
    await Notification.deleteMany({});

    // 8 hours later the event starts in 22 hours and was created more than 6 hours ago
    const now = new Date(Date.now() + 8 * HOUR);
    expect(await sendDueReminders(now)).toBe(1);
    expect(await sendDueReminders(now)).toBe(0);
    await drainEmailQueue();

    const reminders = await Notification.find({ type: NotificationType.RsvpReminder }).lean();
    expect(reminders.map((n) => String(n.user))).toEqual([player1._id.toString()]);
    expect(String(reminders[0].event)).toBe(String(eventId));
    expect(sentTo()).toEqual([player1.email]);
  });

  it('does not remind events starting later than in 24 hours', async () => {
    const { coach, squad } = await setup();
    await createEvent(coach._id, squad._id.toString(), { startInHours: 72 });

    expect(await sendDueReminders(new Date(Date.now() + 8 * HOUR))).toBe(0);
  });

  it('lets the coach send a manual reminder at most once per hour', async () => {
    const { coach, player1, squad } = await setup();
    const { eventId } = await createEvent(coach._id, squad._id.toString());

    const first = await request(app).post(`/api/team-event/remind/${eventId}`).set(asUser(coach._id));
    const second = await request(app).post(`/api/team-event/remind/${eventId}`).set(asUser(coach._id));
    const byPlayer = await request(app).post(`/api/team-event/remind/${eventId}`).set(asUser(player1._id));

    expect(first.status).toBe(200);
    expect(first.body.remindedCount).toBe(2);
    expect(second.status).toBe(429);
    expect(byPlayer.status).toBe(403);
  });
});

describe('Notification API', () => {
  it('returns only own notifications with the unread count and marks them as read', async () => {
    const { user } = await createTestUser();
    const { user: other } = await createTestUser();
    const [mine] = await Notification.create([
      { user: user._id, type: NotificationType.Announcement, title: 'A' },
      { user: user._id, type: NotificationType.Announcement, title: 'B' },
      { user: other._id, type: NotificationType.Announcement, title: 'C' },
    ]);
    const othersNotification = await Notification.findOne({ user: other._id });

    const list = await request(app).get('/api/notification/get-notifications').set(asUser(user._id));
    expect(list.status).toBe(200);
    expect(list.body.notifications).toHaveLength(2);
    expect(list.body.unreadCount).toBe(2);

    const forbidden = await request(app).post(`/api/notification/mark-read/${othersNotification!._id}`).set(asUser(user._id));
    expect(forbidden.status).toBe(404);

    await request(app).post(`/api/notification/mark-read/${mine._id}`).set(asUser(user._id));
    expect((await request(app).get('/api/notification/get-notifications').set(asUser(user._id))).body.unreadCount).toBe(1);

    await request(app).post('/api/notification/mark-all-read').set(asUser(user._id));
    expect((await request(app).get('/api/notification/get-notifications').set(asUser(user._id))).body.unreadCount).toBe(0);
    expect(await Notification.countDocuments({ user: other._id, readAt: { $exists: false } })).toBe(1);
  });

  it('notifies all active members about a new announcement', async () => {
    const { user: admin } = await createTestUser({ isAdmin: true });
    const { user: member } = await createTestUser();
    await createTestUser({ active: false });

    const response = await request(app)
      .post('/api/announcement/create-announcement')
      .set(asUser(admin._id))
      .send({ title: 'News', context: '<p>Hello</p>', visibility: 'private' });

    expect(response.status).toBe(201);

    const notifications = await Notification.find({ type: NotificationType.Announcement }).lean();
    expect(notifications.map((n) => String(n.user))).toEqual([member._id.toString()]);
  });
});

describe('GET /api/announcement/get-announcements', () => {
  it('shows team announcements to logged members and only public ones to visitors', async () => {
    const { user: admin } = await createTestUser({ isAdmin: true });
    const { user: member } = await createTestUser();

    for (const visibility of ['public', 'private']) {
      await request(app)
        .post('/api/announcement/create-announcement')
        .set(asUser(admin._id))
        .send({ title: visibility, context: '<p>Text</p>', visibility });
    }

    const asMember = await request(app).get('/api/announcement/get-announcements').set(asUser(member._id));
    const asVisitor = await request(app).get('/api/announcement/get-announcements');

    expect(asMember.body.map((a: { title: string }) => a.title).sort()).toEqual(['private', 'public']);
    expect(asVisitor.body.map((a: { title: string }) => a.title)).toEqual(['public']);
  });
});
