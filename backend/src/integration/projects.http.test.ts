import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('js-yaml', () => ({
  default: { load: vi.fn(() => ({})) },
  load: vi.fn(() => ({})),
}));

import { app } from '../app';
import { signToken } from '../shared/jwt';

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('TEST_DATABASE_URL is required to run project HTTP integration tests.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const adminId = '123e4567-e89b-12d3-a456-426614174010';
const viewerId = '123e4567-e89b-12d3-a456-426614174011';
const adminToken = () => signToken({ userId: adminId, role: 'ADMIN' });
const viewerToken = () => signToken({ userId: viewerId, role: 'VIEWER' });

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

const createUsers = async (): Promise<void> => {
  await prisma.user.createMany({
    data: [
      {
        id: adminId,
        name: 'Admin',
        email: 'projects-admin@example.com',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
      {
        id: viewerId,
        name: 'Viewer',
        email: 'projects-viewer@example.com',
        passwordHash: 'test-hash',
        role: 'VIEWER',
      },
    ],
  });
};

describe('Projects HTTP integration', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDatabase();
    await createUsers();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('creates a project as ADMIN and persists it in PostgreSQL', async () => {
    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Proyecto HTTP', description: 'Persistente', priority: 'HIGH' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Proyecto HTTP');

    const storedProject = await prisma.project.findUnique({
      where: { name: 'Proyecto HTTP' },
    });
    expect(storedProject).toMatchObject({
      name: 'Proyecto HTTP',
      ownerId: adminId,
      priority: 'HIGH',
    });
  });

  it('rejects project creation by VIEWER', async () => {
    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${viewerToken()}`)
      .send({ name: 'No permitido' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Insufficient permissions');
  });

  it('rejects invalid project payloads', async () => {
    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: '', status: 'INVALID' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Validation error');
  });

  it('lists projects for ADMIN and VIEWER', async () => {
    await prisma.project.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174012',
        name: 'Proyecto listado',
        ownerId: adminId,
      },
    });

    const adminResponse = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${adminToken()}`);
    const viewerResponse = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${viewerToken()}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body).toHaveLength(1);
    expect(viewerResponse.status).toBe(200);
    expect(viewerResponse.body).toEqual([]);
  });

  it('returns 404 for an unknown project', async () => {
    const response = await request(app)
      .get('/projects/123e4567-e89b-12d3-a456-426614174099')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Project not found');
  });

  it('updates a project as ADMIN', async () => {
    const project = await prisma.project.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174013',
        name: 'Proyecto original',
        ownerId: adminId,
      },
    });

    const response = await request(app)
      .patch(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Proyecto actualizado' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Proyecto actualizado');
  });

  it('rejects VIEWER project modifications and deletion', async () => {
    const project = await prisma.project.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174014',
        name: 'Proyecto protegido',
        ownerId: adminId,
      },
    });

    const updateResponse = await request(app)
      .patch(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${viewerToken()}`)
      .send({ name: 'No permitido' });
    const deleteResponse = await request(app)
      .delete(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${viewerToken()}`);

    expect(updateResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
  });

  it('deletes a project as ADMIN', async () => {
    const project = await prisma.project.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174015',
        name: 'Proyecto eliminable',
        ownerId: adminId,
      },
    });

    const response = await request(app)
      .delete(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(204);
    await expect(prisma.project.findUnique({ where: { id: project.id } })).resolves.toBeNull();
  });

  it('rejects requests without or with an invalid JWT', async () => {
    const unauthenticated = await request(app).get('/projects');
    const invalid = await request(app)
      .get('/projects')
      .set('Authorization', 'Bearer invalid-token');

    expect(unauthenticated.status).toBe(401);
    expect(invalid.status).toBe(401);
  });
});
