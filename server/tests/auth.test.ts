import request from 'supertest';
import app from '../server';
import ErrorMessages from '../utils/errorMessages';
import { createTestUser } from './factories/userFactory';

describe('POST /api/user/login', () => {
  it('logs in with valid credentials', async () => {
    const { user, plainPassword } = await createTestUser({
      email: 'coach@example.com',
    });

    const response = await request(app).post('/api/user/login').send({
      email: user.email,
      password: plainPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(user.email);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('rejects a wrong password', async () => {
    const { user } = await createTestUser({
      email: 'player@example.com',
    });

    const response = await request(app).post('/api/user/login').send({
      email: user.email,
      password: 'WrongPassword123!',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe(ErrorMessages.invalidCredentials);
  });

  it('rejects a non-existing user', async () => {
    const response = await request(app).post('/api/user/login').send({
      email: 'missing@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe(ErrorMessages.invalidCredentials);
  });
});
