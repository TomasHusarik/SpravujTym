jest.mock('@middleware/auth.middleware', () => require('./helpers/mockAuth'));

import request from 'supertest';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import app from '../server';
import TeamEvent, { TeamEventStatus, TeamEventType } from '../models/TeamEvent';
import EventSeries from '../models/EventSeries';
import EventParticipation, { EventParticipationStatus } from '../models/EventParticipation';
import Comment from '../models/Comment';
import { SquadRole } from '../models/SquadMembership';
import { createTestUser } from './factories/userFactory';
import { addTestMembership, createTestSquad } from './factories/squadFactory';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Europe/Prague';
const at = (date: string, time: string) => dayjs.tz(`${date} ${time}`, TZ).toISOString();
const localDate = (value: Date) => dayjs(value).tz(TZ).format('YYYY-MM-DD');
const localTime = (value: Date) => dayjs(value).tz(TZ).format('HH:mm');
const asUser = (userId: { toString(): string }) => ({ 'x-test-user-id': userId.toString() });

// 2027-01-05 is a Tuesday
const FIRST_DATE = '2027-01-05';

const setup = async () => {
  const { user: coach } = await createTestUser();
  const { user: player1 } = await createTestUser();
  const { user: player2 } = await createTestUser();
  const { squad } = await createTestSquad();

  await addTestMembership(coach._id, squad._id, [SquadRole.Coach]);
  await addTestMembership(player1._id, squad._id, [SquadRole.Player]);
  await addTestMembership(player2._id, squad._id, [SquadRole.Player]);

  return { coach, player1, player2, squad };
};

const createSeries = async (
  coachId: { toString(): string },
  squadId: string,
  options: { firstDate?: string; recurrence?: Record<string, unknown>; participations?: unknown[] } = {}
) => {
  const firstDate = options.firstDate ?? FIRST_DATE;

  const response = await request(app)
    .post('/api/team-event/create-team-event')
    .set(asUser(coachId))
    .send({
      title: 'Training',
      type: TeamEventType.Training,
      startDate: at(firstDate, '18:00'),
      endDate: at(firstDate, '19:30'),
      squads: [squadId],
      participations: options.participations,
      recurrence: options.recurrence ?? { frequency: 'weekly', interval: 1, weekdays: [2, 4], count: 6 },
    });

  const events = await TeamEvent.find({ series: response.body.seriesId }).sort({ startDate: 1 });
  return { response, events };
};

const updatePayload = (event: { startDate: Date }, overrides: Record<string, unknown> = {}) => ({
  title: 'Training',
  type: TeamEventType.Training,
  startDate: event.startDate.toISOString(),
  endDate: dayjs(event.startDate).add(90, 'minute').toISOString(),
  participations: [] as unknown[],
  ...overrides,
});

describe('Creating a recurring series', () => {
  it('creates all occurrences and invites the whole squad when no participants are sent', async () => {
    const { coach, player1, player2, squad } = await setup();
    const { response, events } = await createSeries(coach._id, squad._id.toString());

    expect(response.status).toBe(201);
    expect(response.body.occurrences).toBe(6);
    expect(events.map((e) => localDate(e.startDate))).toEqual([
      '2027-01-05', '2027-01-07', '2027-01-12', '2027-01-14', '2027-01-19', '2027-01-21',
    ]);
    expect(events.every((e) => localTime(e.startDate) === '18:00' && localTime(e.endDate) === '19:30')).toBe(true);

    const participants = await EventParticipation.find({ event: events[0]._id }).lean();
    expect(participants.map((p) => String(p.user)).sort()).toEqual(
      [player1._id.toString(), player2._id.toString()].sort()
    );
    expect(await EventParticipation.countDocuments()).toBe(12);
  });

  it('uses the participants sent by the client (whole squad minus or plus someone)', async () => {
    const { coach, player1, squad } = await setup();
    const { user: guest } = await createTestUser();

    const { events } = await createSeries(coach._id, squad._id.toString(), {
      participations: [{ userId: player1._id.toString() }, { userId: guest._id.toString() }],
      recurrence: { frequency: 'weekly', weekdays: [2], count: 2 },
    });

    const participants = await EventParticipation.find({ event: events[1]._id }).lean();
    expect(participants.map((p) => String(p.user)).sort()).toEqual([player1._id.toString(), guest._id.toString()].sort());
  });

  it('rejects an invalid recurrence rule', async () => {
    const { coach, squad } = await setup();
    const { response } = await createSeries(coach._id, squad._id.toString(), {
      recurrence: { frequency: 'weekly', weekdays: [2] }, // no end
    });

    expect(response.status).toBe(400);
    expect(await TeamEvent.countDocuments()).toBe(0);
    expect(await EventSeries.countDocuments()).toBe(0);
  });
});

describe('Editing a recurring series', () => {
  it('"only this event" changes a single occurrence and marks it as an exception', async () => {
    const { coach, squad } = await setup();
    const { events } = await createSeries(coach._id, squad._id.toString());

    const response = await request(app)
      .put(`/api/team-event/update-event/${events[1]._id}`)
      .set(asUser(coach._id))
      .send(updatePayload(events[1], { title: 'Special training', scope: 'this', squads: [squad._id.toString()] }));

    expect(response.status).toBe(200);

    const updated = await TeamEvent.find({ series: events[0].series }).sort({ startDate: 1 }).lean();
    expect(updated.map((e) => e.title)).toEqual(['Training', 'Special training', 'Training', 'Training', 'Training', 'Training']);
    expect(updated[1].isException).toBe(true);
  });

  it('"this and following" splits the series and keeps answers of existing occurrences', async () => {
    const { coach, player1, squad } = await setup();
    const { events } = await createSeries(coach._id, squad._id.toString());
    const pivot = events[2];

    await EventParticipation.updateOne({ event: events[4]._id, user: player1._id }, { status: EventParticipationStatus.Confirmed });

    const response = await request(app)
      .put(`/api/team-event/update-event/${pivot._id}`)
      .set(asUser(coach._id))
      .send({
        ...updatePayload(pivot, { scope: 'following', squads: [squad._id.toString()], participations: [{ userId: player1._id.toString() }] }),
        startDate: at(localDate(pivot.startDate), '17:00'),
        endDate: at(localDate(pivot.startDate), '18:00'),
      });

    expect(response.status).toBe(200);

    const oldSeries = await EventSeries.findById(events[0].series).lean();
    const newSeries = await EventSeries.findById(response.body.seriesId).lean();
    expect(String(newSeries!._id)).not.toBe(String(oldSeries!._id));
    expect(localDate(oldSeries!.recurrence.until!)).toBe('2027-01-11');

    const oldOccurrences = await TeamEvent.find({ series: oldSeries!._id }).sort({ startDate: 1 }).lean();
    const newOccurrences = await TeamEvent.find({ series: newSeries!._id }).sort({ startDate: 1 }).lean();

    expect(oldOccurrences).toHaveLength(2);
    expect(oldOccurrences.every((e) => localTime(e.startDate) === '18:00')).toBe(true);
    expect(newOccurrences).toHaveLength(4);
    expect(newOccurrences.every((e) => localTime(e.startDate) === '17:00' && localTime(e.endDate) === '18:00')).toBe(true);

    // The answer of player1 on an existing occurrence is kept, player2 is no longer invited
    const kept = await EventParticipation.find({ event: events[4]._id }).lean();
    expect(kept).toHaveLength(1);
    expect(kept[0].status).toBe(EventParticipationStatus.Confirmed);
  });

  it('"all events" with a new rule removes dates that no longer match and keeps the rest', async () => {
    const { coach, player1, squad } = await setup();
    const { events } = await createSeries(coach._id, squad._id.toString());
    const tuesday = events[2];

    await EventParticipation.updateOne({ event: tuesday._id, user: player1._id }, { status: EventParticipationStatus.Declined, note: 'Sick' });

    const response = await request(app)
      .put(`/api/team-event/update-event/${events[1]._id}`)
      .set(asUser(coach._id))
      .send(updatePayload(events[0], {
        scope: 'all',
        title: 'Tuesday training',
        squads: [squad._id.toString()],
        participations: [{ userId: player1._id.toString() }],
        recurrence: { frequency: 'weekly', weekdays: [2], count: 3 },
      }));

    expect(response.status).toBe(200);

    const remaining = await TeamEvent.find({ series: events[0].series }).sort({ startDate: 1 }).lean();
    expect(remaining.map((e) => localDate(e.startDate))).toEqual(['2027-01-05', '2027-01-12', '2027-01-19']);
    expect(remaining.every((e) => e.title === 'Tuesday training')).toBe(true);

    const keptAnswer = await EventParticipation.findOne({ event: tuesday._id, user: player1._id }).lean();
    expect(keptAnswer?.status).toBe(EventParticipationStatus.Declined);
    expect(keptAnswer?.note).toBe('Sick');

    // Removed Thursday occurrences lost their participations too
    expect(await EventParticipation.countDocuments({ event: events[1]._id })).toBe(0);
  });

  it('"all events" leaves past occurrences untouched', async () => {
    const { coach, squad } = await setup();
    const firstDate = dayjs().tz(TZ).subtract(14, 'day').format('YYYY-MM-DD');
    const { events } = await createSeries(coach._id, squad._id.toString(), {
      firstDate,
      recurrence: { frequency: 'daily', interval: 7, count: 5 },
    });

    const response = await request(app)
      .put(`/api/team-event/update-event/${events[3]._id}`)
      .set(asUser(coach._id))
      .send(updatePayload(events[3], { scope: 'all', title: 'Renamed', squads: [squad._id.toString()] }));

    expect(response.status).toBe(200);

    const occurrences = await TeamEvent.find({ series: events[0].series }).sort({ startDate: 1 }).lean();
    expect(occurrences).toHaveLength(5);
    expect(occurrences.slice(0, 2).map((e) => e.title)).toEqual(['Training', 'Training']);
    expect(occurrences.slice(2).every((e) => e.title === 'Renamed')).toBe(true);
  });
});

describe('Canceling events', () => {
  it('cancels only one occurrence, keeps it visible with the reason and blocks answers', async () => {
    const { coach, player1, squad } = await setup();
    const { events } = await createSeries(coach._id, squad._id.toString());

    const response = await request(app)
      .post(`/api/team-event/cancel-event/${events[1]._id}`)
      .set(asUser(coach._id))
      .send({ scope: 'this', reason: 'Hall is closed' });

    expect(response.status).toBe(200);
    expect(response.body.canceledIds).toHaveLength(1);

    const occurrences = await TeamEvent.find({ series: events[0].series }).sort({ startDate: 1 }).lean();
    expect(occurrences).toHaveLength(6);
    expect(occurrences.map((e) => e.status)).toEqual([
      'scheduled', 'canceled', 'scheduled', 'scheduled', 'scheduled', 'scheduled',
    ]);
    expect(occurrences[1].cancelReason).toBe('Hall is closed');

    const rsvp = await request(app)
      .post('/api/team-event/update-participation-status')
      .set(asUser(player1._id))
      .send({ eventId: events[1]._id.toString(), status: EventParticipationStatus.Confirmed });

    expect(rsvp.status).toBe(400);
  });

  it('cancels this and following occurrences', async () => {
    const { coach, squad } = await setup();
    const { events } = await createSeries(coach._id, squad._id.toString());

    await request(app)
      .post(`/api/team-event/cancel-event/${events[3]._id}`)
      .set(asUser(coach._id))
      .send({ scope: 'following' });

    const statuses = (await TeamEvent.find({ series: events[0].series }).sort({ startDate: 1 }).lean()).map((e) => e.status);
    expect(statuses).toEqual(['scheduled', 'scheduled', 'scheduled', 'canceled', 'canceled', 'canceled']);
  });

  it('cancels the whole series but not the past occurrences, and can restore one occurrence', async () => {
    const { coach, squad } = await setup();
    const firstDate = dayjs().tz(TZ).subtract(14, 'day').format('YYYY-MM-DD');
    const { events } = await createSeries(coach._id, squad._id.toString(), {
      firstDate,
      recurrence: { frequency: 'daily', interval: 7, count: 5 },
    });

    await request(app)
      .post(`/api/team-event/cancel-event/${events[4]._id}`)
      .set(asUser(coach._id))
      .send({ scope: 'all', reason: 'Season ended' });

    const occurrences = await TeamEvent.find({ series: events[0].series }).sort({ startDate: 1 }).lean();
    expect(occurrences.map((e) => e.status)).toEqual(['scheduled', 'scheduled', 'canceled', 'canceled', 'canceled']);
    expect((await EventSeries.findById(events[0].series).lean())?.canceledAt).toBeDefined();

    const restore = await request(app)
      .post(`/api/team-event/restore-event/${events[3]._id}`)
      .set(asUser(coach._id));

    expect(restore.status).toBe(200);
    const restored = await TeamEvent.findById(events[3]._id).lean();
    expect(restored?.status).toBe(TeamEventStatus.Scheduled);
    expect(restored?.cancelReason).toBeUndefined();
  });

  it('cancels a one-off event', async () => {
    const { coach, squad } = await setup();
    const event = await TeamEvent.create({
      title: 'Match',
      type: TeamEventType.Match,
      startDate: new Date(at(FIRST_DATE, '17:00')),
      endDate: new Date(at(FIRST_DATE, '19:00')),
      squads: [squad._id],
      createdBy: coach._id,
    });

    const response = await request(app)
      .post(`/api/team-event/cancel-event/${event._id}`)
      .set(asUser(coach._id))
      .send({ reason: 'Opponent withdrew' });

    expect(response.status).toBe(200);
    expect((await TeamEvent.findById(event._id).lean())?.status).toBe(TeamEventStatus.Canceled);
  });

  it('does not let a coach of another squad cancel the event', async () => {
    const { coach, squad } = await setup();
    const { user: otherCoach } = await createTestUser();
    const { squad: otherSquad } = await createTestSquad();
    await addTestMembership(otherCoach._id, otherSquad._id, [SquadRole.Coach]);
    const { events } = await createSeries(coach._id, squad._id.toString());

    const response = await request(app)
      .post(`/api/team-event/cancel-event/${events[0]._id}`)
      .set(asUser(otherCoach._id))
      .send({ scope: 'all' });

    expect(response.status).toBe(403);
  });
});

describe('Deleting events', () => {
  it('deletes this and following occurrences and shortens the series', async () => {
    const { coach, squad } = await setup();
    const { events } = await createSeries(coach._id, squad._id.toString());

    const response = await request(app)
      .delete(`/api/team-event/delete-event/${events[2]._id}?scope=following`)
      .set(asUser(coach._id));

    expect(response.status).toBe(200);
    expect(await TeamEvent.countDocuments({ series: events[0].series })).toBe(2);
    expect(localDate((await EventSeries.findById(events[0].series).lean())!.recurrence.until!)).toBe('2027-01-11');
  });

  it('deletes the whole series with participations and comments', async () => {
    const { coach, squad } = await setup();
    const { events } = await createSeries(coach._id, squad._id.toString());
    await Comment.create({ author: coach._id, event: events[0]._id, content: 'Bring balls' });

    const response = await request(app)
      .delete(`/api/team-event/delete-event/${events[0]._id}?scope=all`)
      .set(asUser(coach._id));

    expect(response.status).toBe(200);
    expect(await TeamEvent.countDocuments()).toBe(0);
    expect(await EventSeries.countDocuments()).toBe(0);
    expect(await EventParticipation.countDocuments()).toBe(0);
    expect(await Comment.countDocuments()).toBe(0);
  });
});

describe('RSVP', () => {
  it('accepts "maybe" with a note', async () => {
    const { coach, player1, squad } = await setup();
    const { events } = await createSeries(coach._id, squad._id.toString());

    const response = await request(app)
      .post('/api/team-event/update-participation-status')
      .set(asUser(player1._id))
      .send({ eventId: events[0]._id.toString(), status: EventParticipationStatus.Maybe, note: 'Might be late' });

    expect(response.status).toBe(200);

    const participation = await EventParticipation.findOne({ event: events[0]._id, user: player1._id }).lean();
    expect(participation?.status).toBe(EventParticipationStatus.Maybe);
    expect(participation?.note).toBe('Might be late');
  });
});
