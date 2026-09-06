import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

import type { UserRecord } from '../modules/users/repository';

const { repositoryMock } = vi.hoisted(() => ({
  repositoryMock: {
    createUser: vi.fn(),
    findByEmail: vi.fn(),
  },
}));

vi.mock('../modules/users/repository', () => ({
  UserRepository: class {
    public createUser(...args: Parameters<typeof repositoryMock.createUser>) {
      return repositoryMock.createUser(...args);
    }

    public findByEmail(...args: Parameters<typeof repositoryMock.findByEmail>) {
      return repositoryMock.findByEmail(...args);
    }
  },
}));

vi.mock('js-yaml', () => ({
  default: { load: vi.fn(() => ({})) },
  load: vi.fn(() => ({})),
}));

import { app } from '../app';

const user: UserRecord = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Ana',
  email: 'ana@example.com',
  passwordHash: '',
  role: 'VIEWER',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('Auth HTTP integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    user.passwordHash = await bcrypt.hash('password123', 4);
    repositoryMock.createUser.mockResolvedValue(user);
    repositoryMock.findByEmail.mockResolvedValue(user);
  });

  it('registers successfully with 201 and a JWT', async () => {
    const response = await request(app).post('/auth/register').send({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.token).toEqual(expect.any(String));
    expect(repositoryMock.createUser).toHaveBeenCalledOnce();
  });

  it('returns 422 for invalid registration data', async () => {
    const response = await request(app).post('/auth/register').send({
      name: '',
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Validation error');
    expect(repositoryMock.createUser).not.toHaveBeenCalled();
  });

  it('logs in successfully with 200 and a JWT', async () => {
    const response = await request(app).post('/auth/login').send({
      email: user.email,
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it.each([
    ['incorrect password', 'wrong-password'],
    ['unknown user', 'password123'],
  ])('returns 401 for %s', async (reason, password) => {
    if (reason === 'unknown user') {
      repositoryMock.findByEmail.mockResolvedValue(null);
    }

    const response = await request(app).post('/auth/login').send({
      email: reason === 'unknown user' ? 'missing@example.com' : user.email,
      password,
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid email or password');
  });

  it('returns 401 for a protected endpoint without authorization', async () => {
    const response = await request(app).get('/projects');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Authentication required');
  });

  it('returns 401 for a protected endpoint with an invalid JWT', async () => {
    const response = await request(app)
      .get('/projects')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid or expired token');
  });

  it('returns 401 for a protected endpoint with an expired JWT', async () => {
    const expiredToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET ?? 'change-me-in-local-env',
      { expiresIn: -1 },
    );

    const response = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid or expired token');
  });

});
