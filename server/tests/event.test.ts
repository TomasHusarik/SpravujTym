jest.mock('@middleware/auth.middleware', () => require('./helpers/mockAuth'));

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import TeamEvent, { TeamEventType } from '../models/TeamEvent';
import EventParticipation, { EventParticipationStatus } from '../models/EventParticipation';
import League, { LeagueCategory } from '../models/League';
import Squad from '../models/Squad';
import SquadMembership, { SquadRole } from '../models/SquadMembership';
import Team from '../models/Team';
import User from '../models/User';
import Venue from '../models/Venue';
import { createTestUser } from './factories/userFactory';

const createSquadGraph = async () => {
  const venue = await Venue.create({
    name: 'Main Arena',
    city: 'Prague',
    address: 'Arena 1',
    capacity: 1500,
  });

  const team = await Team.create({
    name: 'Blue Horses',
    shortName: 'BH',
    city: 'Prague',
    venue: venue._id,
  });

  const league = await League.create({
    name: 'Top League',
    season: '2025',
    category: LeagueCategory.Men,
  });

  const squad = await Squad.create({
    name: 'A Team',
    league: league._id,
    team: team._id,
  });

  return { venue, squad };
};

describe('POST /api/team-event/create-team-event', () => {
  it('creates an event when the requester is a coach', async () => {
    const { user: coach } = await createTestUser({ email: 'coach@test.local' });
    const { user: player } = await createTestUser({ email: 'player@test.local' });
    const { squad, venue } = await createSquadGraph();

    await SquadMembership.create({
      user: coach._id,
      squad: squad._id,
      roles: [SquadRole.Coach],
      active: true,
    });

    const payload = {
      title: 'Tuesday Training',
      type: TeamEventType.Training,
      startDate: '2025-03-18T17:00:00.000Z',
      endDate: '2025-03-18T19:00:00.000Z',
      venue: venue._id.toString(),
      squads: [squad._id.toString()],
      participations: [
        {
          userId: player._id.toString(),
          status: EventParticipationStatus.Pending,
        },
      ],
    };

    const response = await request(app)
      .post('/api/team-event/create-team-event')
      .set('x-test-user-id', coach._id.toString())
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('eventId');

    const createdEvent = await TeamEvent.findById(response.body.eventId).lean();
    const participation = await EventParticipation.findOne({
      event: response.body.eventId,
      user: player._id,
    }).lean();

    expect(createdEvent?.title).toBe(payload.title);
    expect(participation?.status).toBe(EventParticipationStatus.Pending);
  });

  it('rejects event creation when the requester is only a player', async () => {
    const { user: player } = await createTestUser({ email: 'player-only@test.local' });
    const { squad, venue } = await createSquadGraph();

    await SquadMembership.create({
      user: player._id,
      squad: squad._id,
      roles: [SquadRole.Player],
      active: true,
    });

    const response = await request(app)
      .post('/api/team-event/create-team-event')
      .set('x-test-user-id', player._id.toString())
      .send({
        title: 'Unauthorized Training',
        type: TeamEventType.Training,
        startDate: '2025-03-19T17:00:00.000Z',
        endDate: '2025-03-19T19:00:00.000Z',
        venue: venue._id.toString(),
        squads: [squad._id.toString()],
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Permission to create event is required');

    const createdEvent = await TeamEvent.findOne({ title: 'Unauthorized Training' }).lean();
    expect(createdEvent).toBeNull();
  });
});

describe('POST /api/team-event/update-participation-status', () => {
  it('lets a player respond to attendance', async () => {
    const { user: player } = await createTestUser({ email: 'attendance@test.local' });
    const event = await TeamEvent.create({
      title: 'League Match',
      type: TeamEventType.Match,
      startDate: new Date('2025-03-20T15:00:00.000Z'),
      endDate: new Date('2025-03-20T17:00:00.000Z'),
      createdBy: new mongoose.Types.ObjectId(),
    });

    await EventParticipation.create({
      event: event._id,
      user: player._id,
      status: EventParticipationStatus.Pending,
    });

    const response = await request(app)
      .post('/api/team-event/update-participation-status')
      .set('x-test-user-id', player._id.toString())
      .send({
        eventId: event._id.toString(),
        status: EventParticipationStatus.Confirmed,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Participation status updated');

    const updatedParticipation = await EventParticipation.findOne({
      event: event._id,
      user: player._id,
    }).lean();

    expect(updatedParticipation?.status).toBe(EventParticipationStatus.Confirmed);
  });
});
