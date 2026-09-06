import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from './schemas';

describe('registerSchema', () => {
  it('normalizes valid registration data', () => {
    const result = registerSchema.parse({
      name: '  Ana  ',
      email: ' ANA@EXAMPLE.COM ',
      password: 'password123',
    });

    expect(result).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'password123',
    });
  });

  it('rejects short passwords and invalid emails', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'not-an-email',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('accepts the minimum and maximum password lengths', () => {
    expect(
      registerSchema.safeParse({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'a'.repeat(8),
      }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'a'.repeat(128),
      }).success,
    ).toBe(true);
  });

  it('accepts the minimum and maximum name lengths', () => {
    expect(
      registerSchema.safeParse({
        name: 'A',
        email: 'ana@example.com',
        password: 'password123',
      }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        name: 'A'.repeat(120),
        email: 'ana@example.com',
        password: 'password123',
      }).success,
    ).toBe(true);
  });

  it('rejects names and passwords above their maximum lengths', () => {
    expect(
      registerSchema.safeParse({
        name: 'A'.repeat(121),
        email: 'ana@example.com',
        password: 'password123',
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'a'.repeat(129),
      }).success,
    ).toBe(false);
  });

  it('strips unknown fields from valid registration data', () => {
    const result = registerSchema.parse({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'password123',
      role: 'ADMIN',
    });

    expect(result).not.toHaveProperty('role');
  });

  it('rejects an incomplete registration payload', () => {
    expect(registerSchema.safeParse({ name: 'Ana', email: 'ana@example.com' }).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'ana@example.com', password: 'password123' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'Ana', password: 'password123' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('normalizes the email address', () => {
    const result = loginSchema.parse({
      email: ' USER@EXAMPLE.COM ',
      password: 'password123',
    });

    expect(result.email).toBe('user@example.com');
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an incomplete login payload', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com' }).success).toBe(false);
    expect(loginSchema.safeParse({ password: 'password123' }).success).toBe(false);
  });

  it('strips unknown fields from valid login data', () => {
    const result = loginSchema.parse({
      email: 'user@example.com',
      password: 'password123',
      rememberMe: true,
    });

    expect(result).not.toHaveProperty('rememberMe');
  });

  it('accepts the minimum login password length', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'a' }).success).toBe(true);
  });
});
