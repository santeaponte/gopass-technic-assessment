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
  throw new Error('TEST_DATABASE_URL is required to run task HTTP integration tests.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const adminId = '123e4567-e89b-12d3-a456-426614174020';
const viewerId = '123e4567-e89b-12d3-a456-426614174021';
const otherViewerId = '123e4567-e89b-12d3-a456-426614174022';
const projectId = '123e4567-e89b-12d3-a456-426614174023';

const tokenFor = (userId: string, role: 'ADMIN' | 'VIEWER') =>
  signToken({ userId, role });
const adminToken = () => tokenFor(adminId, 'ADMIN');
const viewerToken = () => tokenFor(viewerId, 'VIEWER');
const otherViewerToken = () => tokenFor(otherViewerId, 'VIEWER');

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
        name: 'Task Admin',
        email: 'tasks-admin@example.com',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
      {
        id: viewerId,
        name: 'Task Viewer',
        email: 'tasks-viewer@example.com',
        passwordHash: 'test-hash',
        role: 'VIEWER',
      },
      {
        id: otherViewerId,
        name: 'Other Viewer',
        email: 'tasks-other@example.com',
        passwordHash: 'test-hash',
        role: 'VIEWER',
      },
    ],
  });
};

const createProject = async (status: 'ACTIVE' | 'PAUSED' = 'ACTIVE') =>
  prisma.project.create({
    data: {
      id: projectId,
      name: status === 'ACTIVE' ? 'Proyecto de tareas' : 'Proyecto pausado',
      status,
      ownerId: adminId,
    },
  });

const createTask = async (title = 'Tarea existente', assigneeId: string | null = viewerId) =>
  prisma.task.create({
    data: {
      id: '123e4567-e89b-12d3-a456-426614174024',
      title,
      projectId,
      creatorId: adminId,
      assigneeId,
    },
  });

describe('Tasks HTTP integration', () => {
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

  it('creates a task as ADMIN and persists it', async () => {
    await createProject();

    const response = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Tarea HTTP', projectId, priority: 'HIGH' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Tarea HTTP');
    expect(response.body.statusHistory).toHaveLength(1);

    await expect(prisma.task.findFirst({ where: { title: 'Tarea HTTP', projectId } }))
      .resolves.toMatchObject({ creatorId: adminId, priority: 'HIGH' });
  });

  it('returns the real API error when VIEWER creates a task', async () => {
    await createProject();

    const response = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${viewerToken()}`)
      .send({ title: 'Tarea viewer', projectId });

    expect([404, 409, 403]).toContain(response.status);
  });

  it('rejects creation for missing or inactive projects', async () => {
    const missing = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Sin proyecto', projectId });

    await createProject('PAUSED');
    const inactive = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Proyecto pausado', projectId });

    expect(missing.status).toBe(404);
    expect(inactive.status).toBe(409);
  });

  it('rejects invalid task payloads', async () => {
    const response = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: '', projectId: 'not-a-uuid' });

    expect(response.status).toBe(422);
  });

  it('lists tasks and returns an existing task with status history', async () => {
    await createProject();
    const task = await createTask();
    await prisma.taskStatusChange.create({
      data: { taskId: task.id, toStatus: 'PENDING', changedBy: adminId },
    });

    const listResponse = await request(app)
      .get(`/tasks?projectId=${projectId}`)
      .set('Authorization', `Bearer ${adminToken()}`);
    const detailResponse = await request(app)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.statusHistory).toHaveLength(1);
  });

  it('returns 404 for an unknown task', async () => {
    const response = await request(app)
      .get('/tasks/123e4567-e89b-12d3-a456-426614174099')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(404);
  });

  it('updates and reassigns a task as ADMIN', async () => {
    await createProject();
    const task = await createTask();

    const response = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Tarea actualizada', assigneeId: otherViewerId });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Tarea actualizada');
    await expect(prisma.task.findUnique({ where: { id: task.id } }))
      .resolves.toMatchObject({ assigneeId: otherViewerId });
  });

  it('rejects VIEWER updates to fields other than assignee', async () => {
    await createProject();
    const task = await createTask();

    const response = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${viewerToken()}`)
      .send({ title: 'No permitido' });

    expect(response.status).toBe(403);
  });

  it('changes status and persists status history', async () => {
    await createProject();
    const task = await createTask();

    const response = await request(app)
      .patch(`/tasks/${task.id}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'IN_PROGRESS', comment: 'Comenzada' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
    await expect(prisma.taskStatusChange.findFirst({ where: { taskId: task.id, toStatus: 'IN_PROGRESS' } }))
      .resolves.toMatchObject({ comment: 'Comenzada', changedBy: adminId });
  });

  it('rejects invalid transitions and unauthorized VIEWER status changes', async () => {
    await createProject();
    const task = await createTask('Tarea no asignada', null);

    const invalid = await request(app)
      .patch(`/tasks/${task.id}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'PENDING' });
    const unauthorized = await request(app)
      .patch(`/tasks/${task.id}/status`)
      .set('Authorization', `Bearer ${otherViewerToken()}`)
      .send({ status: 'IN_PROGRESS' });

    expect(invalid.status).toBe(409);
    expect(unauthorized.status).toBe(404);
  });

  it('returns the real API error for assigning an unknown user', async () => {
    await createProject();
    const task = await createTask();

    const response = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ assigneeId: '123e4567-e89b-12d3-a456-426614174099' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Assignee was not found');
  });

  it('creates and lists notes', async () => {
    await createProject();
    const task = await createTask();

    const createResponse = await request(app)
      .post(`/tasks/${task.id}/notes`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ content: 'Nota HTTP' });
    const listResponse = await request(app)
      .get(`/tasks/${task.id}/notes`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(createResponse.status).toBe(201);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].content).toBe('Nota HTTP');
  });

  it('rejects notes in an inactive project and unauthorized access', async () => {
    await createProject('PAUSED');
    const task = await createTask();

    const inactive = await request(app)
      .post(`/tasks/${task.id}/notes`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ content: 'No permitida' });
    const unauthorized = await request(app)
      .get(`/tasks/${task.id}/notes`)
      .set('Authorization', `Bearer ${otherViewerToken()}`);

    expect(inactive.status).toBe(409);
    expect(unauthorized.status).toBe(404);
  });

  it('deletes a task as ADMIN and rejects VIEWER deletion', async () => {
    await createProject();
    const task = await createTask();

    const viewerResponse = await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${viewerToken()}`);
    const adminResponse = await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(viewerResponse.status).toBe(403);
    expect(adminResponse.status).toBe(204);
    await expect(prisma.task.findUnique({ where: { id: task.id } })).resolves.toBeNull();
  });

  it('rejects task access without or with an invalid JWT', async () => {
    const unauthenticated = await request(app).get('/tasks');
    const invalid = await request(app)
      .get('/tasks')
      .set('Authorization', 'Bearer invalid-token');

    expect(unauthenticated.status).toBe(401);
    expect(invalid.status).toBe(401);
  });
});
