import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

dotenv.config({ path: '.env.test' });

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('TEST_DATABASE_URL is required to run database integration tests.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const resetDatabase = async (): Promise<void> => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "task_status_changes",
      "task_notes",
      "tasks",
      "projects",
      "users"
    RESTART IDENTITY CASCADE
  `);
};

describe('PostgreSQL test database', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('inserts and reads data from the isolated database', async () => {
    const user = await prisma.user.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Integration User',
        email: 'integration@example.com',
        passwordHash: 'test-hash',
      },
    });

    const storedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(storedUser).toMatchObject({
      id: user.id,
      email: 'integration@example.com',
      role: 'VIEWER',
    });
  });
});
