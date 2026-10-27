jest.mock('@middleware/auth.middleware', () => require('./helpers/mockAuth'));
jest.mock('../services/mailer', () => ({
  mailer: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../server';
import User from '../models/User';
import Comment from '../models/Comment';
import Payment, { PaymentStatus, PaymentType } from '../models/Payment';
import TeamEvent, { TeamEventType } from '../models/TeamEvent';
import EventParticipation from '../models/EventParticipation';
import SquadMembership, { SquadRole } from '../models/SquadMembership';
import { mailer } from '../services/mailer';
import { createTestUser } from './factories/userFactory';
import { addTestMembership, createTestSquad } from './factories/squadFactory';

const asUser = (userId: { toString(): string }) => ({ 'x-test-user-id': userId.toString() });

const eventPayload = (squadIds: string[]) => ({
  title: 'Training',
  type: TeamEventType.Training,
  startDate: '2025-03-18T17:00:00.000Z',
  endDate: '2025-03-18T19:00:00.000Z',
  squads: squadIds,
  participations: [] as unknown[],
});

describe('POST /api/user/sign-up-admin', () => {
  it('rejects anonymous requests', async () => {
    const response = await request(app)
      .post('/api/user/sign-up-admin')
      .send({ email: 'intruder@test.local', password: 'Password123!', isAdmin: true });

    expect(response.status).toBe(401);
    expect(await User.findOne({ email: 'intruder@test.local' })).toBeNull();
  });

  it('rejects non-admin users', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .post('/api/user/sign-up-admin')
      .set(asUser(user._id))
      .send({ email: 'intruder@test.local', password: 'Password123!' });

    expect(response.status).toBe(403);
  });

  it('lets an admin create another admin with whitelisted fields only', async () => {
    const { user: admin } = await createTestUser({ isAdmin: true });

    const response = await request(app)
      .post('/api/user/sign-up-admin')
      .set(asUser(admin._id))
      .send({ email: 'new-admin@test.local', password: 'Password123!', firstName: 'New', active: false });

    expect(response.status).toBe(201);

    const created = await User.findOne({ email: 'new-admin@test.local' }).lean();
    expect(created?.isAdmin).toBe(true);
    expect(created?.firstName).toBe('New');
    expect(created?.active).toBe(true);
  });
});

describe('PUT /api/user/update-user/:userId', () => {
  it('does not let a coach edit another user by sending their own squadId', async () => {
    const { user: coach } = await createTestUser();
    const { user: victim } = await createTestUser({ firstName: 'Original' });
    const { squad } = await createTestSquad();
    await addTestMembership(coach._id, squad._id, [SquadRole.Coach]);

    const response = await request(app)
      .put(`/api/user/update-user/${victim._id}`)
      .set(asUser(coach._id))
      .send({ squadId: squad._id.toString(), firstName: 'Hacked', password: 'x' });

    expect(response.status).toBe(403);

    const unchanged = await User.findById(victim._id).lean();
    expect(unchanged?.firstName).toBe('Original');
  });

  it('ignores password and privileged fields when users edit their own profile', async () => {
    const { user, plainPassword } = await createTestUser({ firstName: 'Before' });

    const response = await request(app)
      .put(`/api/user/update-user/${user._id}`)
      .set(asUser(user._id))
      .send({ firstName: 'After', password: 'plain-text', isAdmin: true, email: 'other@test.local' });

    expect(response.status).toBe(200);

    const updated = await User.findById(user._id).select('+password').lean();
    expect(updated?.firstName).toBe('After');
    expect(updated?.isAdmin).toBe(false);
    expect(updated?.email).toBe(user.email);
    expect(await bcrypt.compare(plainPassword, updated!.password)).toBe(true);
  });
});

describe('PUT /api/user/update-password', () => {
  it('always changes the password of the logged user, ignoring userId in the body', async () => {
    const { user, plainPassword } = await createTestUser();
    const { user: other, plainPassword: otherPassword } = await createTestUser();

    const response = await request(app)
      .put('/api/user/update-password')
      .set(asUser(user._id))
      .send({
        userId: other._id.toString(),
        currentPassword: plainPassword,
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });

    expect(response.status).toBe(200);

    const updated = await User.findById(user._id).select('+password').lean();
    const untouched = await User.findById(other._id).select('+password').lean();
    expect(await bcrypt.compare('NewPassword123!', updated!.password)).toBe(true);
    expect(await bcrypt.compare(otherPassword, untouched!.password)).toBe(true);
  });
});

describe('POST /api/user/login', () => {
  it('rejects deactivated users', async () => {
    const { user, plainPassword } = await createTestUser({ active: false });

    const response = await request(app)
      .post('/api/user/login')
      .send({ email: user.email, password: plainPassword });

    expect(response.status).toBe(401);
  });

  it('rate limits repeated attempts for the same e-mail', async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 11; i++) {
      const response = await request(app)
        .post('/api/user/login')
        .send({ email: 'brute-force@test.local', password: 'wrong' });
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

describe('DELETE /api/comment/delete-comment/:commentId', () => {
  it('does not let a user delete someone else\'s comment by spoofing the author', async () => {
    const { user: author } = await createTestUser();
    const { user: attacker } = await createTestUser();
    const comment = await Comment.create({ author: author._id, event: author._id, content: 'Hello' });

    const response = await request(app)
      .delete(`/api/comment/delete-comment/${comment._id}`)
      .set(asUser(attacker._id))
      .send({ author: attacker._id.toString() });

    expect(response.status).toBe(403);
    expect(await Comment.findById(comment._id)).not.toBeNull();
  });

  it('lets the author delete their comment', async () => {
    const { user: author } = await createTestUser();
    const comment = await Comment.create({ author: author._id, event: author._id, content: 'Hello' });

    const response = await request(app)
      .delete(`/api/comment/delete-comment/${comment._id}`)
      .set(asUser(author._id));

    expect(response.status).toBe(200);
    expect(await Comment.findById(comment._id)).toBeNull();
  });
});

describe('Team event permissions', () => {
  const setup = async () => {
    const { user: coachA } = await createTestUser();
    const { user: coachB } = await createTestUser();
    const { user: playerA } = await createTestUser();
    const { user: outsider } = await createTestUser();
    const { squad: squadA } = await createTestSquad('A');
    const { squad: squadB } = await createTestSquad('B');

    await addTestMembership(coachA._id, squadA._id, [SquadRole.Coach]);
    await addTestMembership(coachB._id, squadB._id, [SquadRole.Coach]);
    await addTestMembership(playerA._id, squadA._id, [SquadRole.Player]);

    const event = await TeamEvent.create({
      title: 'Squad A training',
      type: TeamEventType.Training,
      startDate: new Date('2025-03-18T17:00:00.000Z'),
      endDate: new Date('2025-03-18T19:00:00.000Z'),
      squads: [squadA._id],
      createdBy: coachA._id,
    });

    return { coachA, coachB, playerA, outsider, squadA, squadB, event };
  };

  it('does not let a coach of another squad update or delete the event', async () => {
    const { coachB, squadA, event } = await setup();

    const updateResponse = await request(app)
      .put(`/api/team-event/update-event/${event._id}`)
      .set(asUser(coachB._id))
      .send({ ...eventPayload([squadA._id.toString()]), title: 'Hacked' });

    const deleteResponse = await request(app)
      .delete(`/api/team-event/delete-event/${event._id}`)
      .set(asUser(coachB._id));

    expect(updateResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect((await TeamEvent.findById(event._id).lean())?.title).toBe('Squad A training');
  });

  it('lets the squad coach update the event', async () => {
    const { coachA, squadA, event } = await setup();

    const response = await request(app)
      .put(`/api/team-event/update-event/${event._id}`)
      .set(asUser(coachA._id))
      .send({ ...eventPayload([squadA._id.toString()]), title: 'Updated' });

    expect(response.status).toBe(200);
    expect((await TeamEvent.findById(event._id).lean())?.title).toBe('Updated');
  });

  it('does not let a coach create an event for a squad they do not coach', async () => {
    const { coachB, squadA } = await setup();

    const response = await request(app)
      .post('/api/team-event/create-team-event')
      .set(asUser(coachB._id))
      .send(eventPayload([squadA._id.toString()]));

    expect(response.status).toBe(403);
  });

  it('shows the event only to managers, participants and squad members', async () => {
    const { playerA, outsider, event } = await setup();

    const outsiderResponse = await request(app)
      .get(`/api/team-event/get-team-event/${event._id}`)
      .set(asUser(outsider._id));

    const playerResponse = await request(app)
      .get(`/api/team-event/get-team-event/${event._id}`)
      .set(asUser(playerA._id));

    expect(outsiderResponse.status).toBe(403);
    expect(playerResponse.status).toBe(200);
  });

  it('rejects an invalid participation status', async () => {
    const { playerA, event } = await setup();
    await EventParticipation.create({ event: event._id, user: playerA._id });

    const response = await request(app)
      .post('/api/team-event/update-participation-status')
      .set(asUser(playerA._id))
      .send({ eventId: event._id.toString(), status: 'hacked' });

    expect(response.status).toBe(400);
  });
});

describe('PUT /api/squad/update-squad-member-roles/:membershipId', () => {
  it('does not let a coach change memberships of another squad by sending their own squadId', async () => {
    const { user: coachB } = await createTestUser();
    const { user: player } = await createTestUser();
    const { squad: squadA } = await createTestSquad('A');
    const { squad: squadB } = await createTestSquad('B');
    await addTestMembership(coachB._id, squadB._id, [SquadRole.Coach]);
    const membership = await addTestMembership(player._id, squadA._id, [SquadRole.Player]);

    const response = await request(app)
      .put(`/api/squad/update-squad-member-roles/${membership._id}`)
      .set(asUser(coachB._id))
      .send({ squadId: squadB._id.toString(), roles: [SquadRole.Coach] });

    expect(response.status).toBe(403);
    expect((await SquadMembership.findById(membership._id).lean())?.roles).toEqual([SquadRole.Player]);
  });
});

describe('GET /api/payment/get-payment/:paymentId', () => {
  it('shows a payment only to its owner or an admin', async () => {
    const { user: owner } = await createTestUser();
    const { user: other } = await createTestUser();
    const payment = await Payment.create({
      user: owner._id,
      amount: 500,
      status: PaymentStatus.Pending,
      dueDate: new Date('2025-04-01'),
      type: PaymentType.Membership,
    });

    const otherResponse = await request(app)
      .get(`/api/payment/get-payment/${payment._id}`)
      .set(asUser(other._id));

    const ownerResponse = await request(app)
      .get(`/api/payment/get-payment/${payment._id}`)
      .set(asUser(owner._id));

    expect(otherResponse.status).toBe(403);
    expect(ownerResponse.status).toBe(200);
  });
});

describe('POST /api/email/send-email', () => {
  it('escapes HTML in the message and rate limits the contact form', async () => {
    const mailerMock = mailer as jest.MockedFunction<typeof mailer>;
    mailerMock.mockClear();

    const payload = {
      name: '<b>Eve</b>',
      email: 'eve@test.local',
      message: '<script>alert(1)</script>',
    };

    const first = await request(app).post('/api/email/send-email').send(payload);
    expect(first.status).toBe(200);

    const html = mailerMock.mock.calls[0][0].context;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');

    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const response = await request(app).post('/api/email/send-email').send(payload);
      statuses.push(response.status);
    }

    expect(statuses[statuses.length - 1]).toBe(429);
  });
});
