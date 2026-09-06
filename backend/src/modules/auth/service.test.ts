import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'unit-test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
});

import { AuthService } from './service';
import type { LoginInput, RegisterInput } from './schemas';
import type { UserRecord } from '../users/repository';
import { verifyToken } from '../../shared/jwt';

const createUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Ana',
  email: 'ana@example.com',
  passwordHash: '$2b$12$LQv3c1yqBWk5b6h8qQx2UOeZzNf3YwR0w6fYQ5vQ7w7YxYxYxYxYx',
  role: 'VIEWER',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const createRepositoryMock = () => ({
  createUser: vi.fn(),
  findByEmail: vi.fn(),
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a user and returns a public user with a token', async () => {
    const repository = createRepositoryMock();
    const user = createUser();
    repository.createUser.mockResolvedValue(user);
    const service = new AuthService(repository as never);
    const input: RegisterInput = {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'password123',
    };

    const result = await service.register(input);

    expect(repository.createUser).toHaveBeenCalledWith({
      name: input.name,
      email: input.email,
      passwordHash: expect.any(String),
      role: 'VIEWER',
    });
    expect(result.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(verifyToken(result.token)).toEqual({ userId: user.id, role: user.role });
  });

  it('rejects registration when the repository reports a duplicate email', async () => {
    const repository = createRepositoryMock();
    repository.createUser.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );
    const service = new AuthService(repository as never);

    await expect(
      service.register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Email is already registered',
    });
  });

  it('logs in successfully with the correct password', async () => {
    const repository = createRepositoryMock();
    const password = 'password123';
    const bcrypt = await import('bcrypt');
    const user = createUser({ passwordHash: await bcrypt.hash(password, 4) });
    repository.findByEmail.mockResolvedValue(user);
    const service = new AuthService(repository as never);

    const result = await service.login({
      email: user.email,
      password,
    });

    expect(repository.findByEmail).toHaveBeenCalledWith(user.email);
    expect(result.user.id).toBe(user.id);
    expect(verifyToken(result.token)).toEqual({ userId: user.id, role: user.role });
  });

  it('rejects login with an incorrect password', async () => {
    const repository = createRepositoryMock();
    const bcrypt = await import('bcrypt');
    repository.findByEmail.mockResolvedValue(
      createUser({ passwordHash: await bcrypt.hash('correct-password', 4) }),
    );
    const service = new AuthService(repository as never);

    await expect(
      service.login({
        email: 'ana@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  it('rejects login when the user does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findByEmail.mockResolvedValue(null);
    const service = new AuthService(repository as never);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password123',
      } satisfies LoginInput),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  it('rejects login for a deactivated user after validating the password', async () => {
    const repository = createRepositoryMock();
    const bcrypt = await import('bcrypt');
    repository.findByEmail.mockResolvedValue({
      ...createUser({ passwordHash: await bcrypt.hash('password123', 4) }),
      isActive: false,
    });
    const service = new AuthService(repository as never);

    await expect(
      service.login({
        email: 'ana@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Tu usuario está desactivado',
    });
  });
});
