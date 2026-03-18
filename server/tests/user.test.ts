jest.mock('@middleware/auth.middleware', () => require('./helpers/mockAuth'));

import request from 'supertest';
import app from '../server';
import User from '../models/User';
import { createTestUser } from './factories/userFactory';

describe('POST /api/user/sign-up', () => {
  it('lets an admin invite a user', async () => {
    const { user: admin } = await createTestUser({
      email: 'admin@test.local',
      isAdmin: true,
    });

    const response = await request(app)
      .post('/api/user/sign-up')
      .set('x-test-user-id', admin._id.toString())
      .send({
        email: 'new-user@test.local',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('new-user@test.local');
    expect(response.body).toHaveProperty('password');

    const invitedUser = await User.findOne({ email: 'new-user@test.local' }).select('+password').lean();
    expect(invitedUser).not.toBeNull();
    expect(invitedUser?.password).toBeTruthy();
  });
});

describe('PUT /api/user/update-user/:userId', () => {
  it('lets an admin update a user profile', async () => {
    const { user: admin } = await createTestUser({
      email: 'admin-update@test.local',
      isAdmin: true,
    });
    const { user: targetUser } = await createTestUser({
      email: 'target@test.local',
      firstName: 'Before',
      lastName: 'Name',
    });

    const response = await request(app)
      .put(`/api/user/update-user/${targetUser._id.toString()}`)
      .set('x-test-user-id', admin._id.toString())
      .send({
        firstName: 'Updated',
        lastName: 'Player',
        active: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe('Updated');
    expect(response.body.lastName).toBe('Player');
    expect(response.body.active).toBe(false);

    const updatedUser = await User.findById(targetUser._id).lean();
    expect(updatedUser?.firstName).toBe('Updated');
    expect(updatedUser?.active).toBe(false);
  });
});
