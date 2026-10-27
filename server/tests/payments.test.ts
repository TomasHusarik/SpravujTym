jest.mock('@middleware/auth.middleware', () => require('./helpers/mockAuth'));

import request from 'supertest';
import app from '../server';
import Payment, { PaymentStatus, PaymentType } from '../models/Payment';
import Notification, { NotificationType } from '../models/Notification';
import { SquadRole } from '../models/SquadMembership';
import { createTestUser } from './factories/userFactory';
import { addTestMembership, createTestSquad } from './factories/squadFactory';

const asUser = (userId: { toString(): string }) => ({ 'x-test-user-id': userId.toString() });

const setup = async () => {
  const { user: admin } = await createTestUser({ isAdmin: true });
  const { user: player1 } = await createTestUser();
  const { user: player2 } = await createTestUser();
  const { user: other } = await createTestUser();
  const { squad } = await createTestSquad();
  const { squad: otherSquad } = await createTestSquad();

  await addTestMembership(player1._id, squad._id, [SquadRole.Player]);
  await addTestMembership(player2._id, squad._id, [SquadRole.Player]);
  await addTestMembership(other._id, otherSquad._id, [SquadRole.Player]);

  return { admin, player1, player2, other, squad, otherSquad };
};

const paymentBody = (overrides: Record<string, unknown> = {}) => ({
  amount: 2500,
  type: PaymentType.Membership,
  dueDate: '2027-01-31',
  description: 'Příspěvek jaro 2027',
  ...overrides,
});

describe('POST /api/payment/add-payments', () => {
  it('creates one payment per player of a squad plus individual members, without duplicates', async () => {
    const { admin, player1, player2, other, squad } = await setup();

    const response = await request(app)
      .post('/api/payment/add-payments')
      .set(asUser(admin._id))
      .send(paymentBody({ squadIds: [squad._id.toString()], userIds: [player1._id.toString(), other._id.toString()] }));

    expect(response.status).toBe(201);
    expect(response.body).toHaveLength(3);

    const users = (await Payment.find().lean()).map((p) => String(p.user)).sort();
    expect(users).toEqual([player1._id, player2._id, other._id].map(String).sort());
    expect((await Payment.findOne({ user: player1._id }).lean())?.description).toBe('Příspěvek jaro 2027');
  });

  it('notifies members about the new payment', async () => {
    const { admin, player1 } = await setup();

    await request(app)
      .post('/api/payment/add-payments')
      .set(asUser(admin._id))
      .send(paymentBody({ userIds: [player1._id.toString()] }));

    const notification = await Notification.findOne({ user: player1._id }).lean();
    expect(notification?.type).toBe(NotificationType.PaymentCreated);
    expect(notification?.title).toContain('2');
    expect(notification?.message).toContain('Příspěvek jaro 2027');
  });

  it('validates the input', async () => {
    const { admin, player1 } = await setup();
    const send = (body: Record<string, unknown>) =>
      request(app).post('/api/payment/add-payments').set(asUser(admin._id)).send(body);

    expect((await send(paymentBody({ userIds: [] }))).status).toBe(400);
    expect((await send(paymentBody({ userIds: [player1._id.toString()], amount: 0 }))).status).toBe(400);
    expect((await send(paymentBody({ userIds: [player1._id.toString()], type: 'gift' }))).status).toBe(400);
    expect((await send(paymentBody({ userIds: [player1._id.toString()], dueDate: 'tomorrow' }))).status).toBe(400);
    expect(await Payment.countDocuments()).toBe(0);
  });

  it('is allowed only for admins', async () => {
    const { player1 } = await setup();

    const response = await request(app)
      .post('/api/payment/add-payments')
      .set(asUser(player1._id))
      .send(paymentBody({ userIds: [player1._id.toString()] }));

    expect(response.status).toBe(403);
  });
});

describe('Payment overview and updates', () => {
  it('lists all payments for admins with filters by status and squad', async () => {
    const { admin, player1, other, squad } = await setup();
    await Payment.create([
      { user: player1._id, amount: 100, type: PaymentType.Fines, dueDate: new Date(), status: PaymentStatus.Pending },
      { user: player1._id, amount: 200, type: PaymentType.Membership, dueDate: new Date(), status: PaymentStatus.Completed },
      { user: other._id, amount: 300, type: PaymentType.Membership, dueDate: new Date(), status: PaymentStatus.Pending },
    ]);

    const all = await request(app).get('/api/payment/get-all-payments').set(asUser(admin._id));
    const pending = await request(app).get('/api/payment/get-all-payments?status=pending').set(asUser(admin._id));
    const bySquad = await request(app).get(`/api/payment/get-all-payments?squadId=${squad._id}`).set(asUser(admin._id));
    const asPlayer = await request(app).get('/api/payment/get-all-payments').set(asUser(player1._id));

    expect(all.body).toHaveLength(3);
    expect(all.body[0].user).toHaveProperty('firstName');
    expect(pending.body.map((p: { amount: number }) => p.amount).sort()).toEqual([100, 300]);
    expect(bySquad.body).toHaveLength(2);
    expect(asPlayer.status).toBe(403);
  });

  it('records when a payment was marked as paid and clears it when reopened', async () => {
    const { admin, player1 } = await setup();
    const payment = await Payment.create({
      user: player1._id, amount: 500, type: PaymentType.Membership, dueDate: new Date(), status: PaymentStatus.Pending,
    });

    const paid = await request(app)
      .put(`/api/payment/update-payment/${payment._id}`)
      .set(asUser(admin._id))
      .send({ status: PaymentStatus.Completed });

    expect(paid.status).toBe(200);
    expect(paid.body.paidAt).toBeDefined();
    expect(paid.body.user.firstName).toBeDefined();

    const reopened = await request(app)
      .put(`/api/payment/update-payment/${payment._id}`)
      .set(asUser(admin._id))
      .send({ status: PaymentStatus.Pending });

    expect(reopened.body.paidAt).toBeUndefined();
  });

  it('rejects invalid updates', async () => {
    const { admin, player1 } = await setup();
    const payment = await Payment.create({
      user: player1._id, amount: 500, type: PaymentType.Membership, dueDate: new Date(),
    });

    const response = await request(app)
      .put(`/api/payment/update-payment/${payment._id}`)
      .set(asUser(admin._id))
      .send({ amount: -5 });

    expect(response.status).toBe(400);
  });
});
