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
});
