import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskService } from './service';
import type { TaskRecord } from './repository';

const taskId = '123e4567-e89b-12d3-a456-426614174000';
const projectId = '123e4567-e89b-12d3-a456-426614174001';
const creatorId = '123e4567-e89b-12d3-a456-426614174002';
const assigneeId = '123e4567-e89b-12d3-a456-426614174003';
const otherUserId = '123e4567-e89b-12d3-a456-426614174004';

const createTask = (overrides: Partial<TaskRecord> = {}): TaskRecord => ({
  id: taskId,
  title: 'Tarea',
  description: 'Descripción',
  status: 'PENDING',
  priority: 'MEDIUM',
  projectId,
  creatorId,
  archivedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  dueDate: new Date('2026-09-30T00:00:00.000Z'),
  project: {
    id: projectId,
    name: 'Proyecto',
    description: 'Descripción',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    dueDate: new Date('2026-09-30T00:00:00.000Z'),
    owner: {
      id: creatorId,
      name: 'Creador',
      email: 'creator@example.com',
      role: 'ADMIN',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  },
  creator: {
    id: creatorId,
    name: 'Creador',
    email: 'creator@example.com',
    role: 'ADMIN',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  assignee: {
    id: assigneeId,
    name: 'Asignado',
    email: 'assignee@example.com',
    role: 'VIEWER',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  statusHistory: [],
  ...overrides,
});

const createRepositoryMock = () => {
  const repository = {
    transaction: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findProjectById: vi.fn(),
    findUserById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    findNotes: vi.fn(),
    createNote: vi.fn(),
    createStatusChange: vi.fn(),
    getCurrentStatus: vi.fn(),
  };

  repository.transaction.mockImplementation(async (callback) => callback(repository as never));
  return repository;
};

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Database constraint failed', {
    code,
    clientVersion: '7.10.0',
  });

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a task in an active project and records its initial status', async () => {
    const repository = createRepositoryMock();
    const task = createTask();
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.findUserById.mockResolvedValue({ id: assigneeId });
    repository.create.mockResolvedValue(task);
    repository.findById.mockResolvedValue(task);
    const service = new TaskService(repository as never);
    const input = { title: 'Tarea', projectId, assigneeId };

    const result = await service.create(input, creatorId, 'ADMIN');

    expect(repository.findProjectById).toHaveBeenCalledWith(projectId, creatorId, 'ADMIN');
    expect(repository.create).toHaveBeenCalledWith({ ...input, creatorId });
    expect(repository.createStatusChange).toHaveBeenCalledWith({
      taskId,
      fromStatus: null,
      toStatus: 'PENDING',
      changedBy: creatorId,
    });
    expect(result).toBe(task);
  });

  it('rejects creation when the project does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findProjectById.mockResolvedValue(null);
    const service = new TaskService(repository as never);

    await expect(service.create({ title: 'Tarea', projectId }, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Project not found',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects creation in an inactive project', async () => {
    const repository = createRepositoryMock();
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'PAUSED' });
    const service = new TaskService(repository as never);

    await expect(service.create({ title: 'Tarea', projectId }, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 409,
      message: 'El proyecto está inactivo. Actívalo antes de modificar sus tareas',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects creation when the assignee does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.findUserById.mockResolvedValue(null);
    const service = new TaskService(repository as never);

    await expect(
      service.create({ title: 'Tarea', projectId, assigneeId }, creatorId, 'ADMIN'),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Assignee was not found',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('maps duplicate task titles to a conflict error', async () => {
    const repository = createRepositoryMock();
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.findUserById.mockResolvedValue(null);
    repository.create.mockRejectedValue(prismaError('P2002'));
    const service = new TaskService(repository as never);

    await expect(service.create({ title: 'Tarea', projectId }, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Ya existe una tarea con ese nombre en este proyecto',
    });
  });

  it('lists and searches tasks with visibility parameters', async () => {
    const repository = createRepositoryMock();
    const tasks = [createTask()];
    repository.findAll.mockResolvedValue(tasks);
    const service = new TaskService(repository as never);

    const result = await service.findAll('buscar', projectId, creatorId, 'VIEWER');

    expect(repository.findAll).toHaveBeenCalledWith('buscar', projectId, creatorId, 'VIEWER');
    expect(result).toBe(tasks);
  });

  it('returns an existing task and rejects an unknown task', async () => {
    const repository = createRepositoryMock();
    const task = createTask();
    repository.findById.mockResolvedValueOnce(task).mockResolvedValueOnce(null);
    const service = new TaskService(repository as never);

    await expect(service.findById(taskId, creatorId, 'ADMIN')).resolves.toBe(task);
    await expect(service.findById(taskId, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Task not found',
    });
  });

  it('updates a task successfully as ADMIN', async () => {
    const repository = createRepositoryMock();
    const task = createTask();
    const updatedTask = { ...task, title: 'Actualizada' };
    repository.findById.mockResolvedValue(task);
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.update.mockResolvedValue(updatedTask);
    repository.findById.mockResolvedValueOnce(task).mockResolvedValueOnce(updatedTask);
    const service = new TaskService(repository as never);

    const result = await service.update(taskId, { title: 'Actualizada' }, creatorId, 'ADMIN');

    expect(repository.update).toHaveBeenCalledWith(taskId, { title: 'Actualizada' });
    expect(result?.title).toBe('Actualizada');
  });

  it('allows VIEWER to update only the assignee', async () => {
    const repository = createRepositoryMock();
    const task = createTask();
    repository.findById.mockResolvedValue(task);
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.findUserById.mockResolvedValue({ id: otherUserId });
    repository.update.mockResolvedValue({ ...task, assigneeId: otherUserId });
    const service = new TaskService(repository as never);

    await service.update(taskId, { assigneeId: otherUserId }, assigneeId, 'VIEWER');

    expect(repository.update).toHaveBeenCalledWith(taskId, { assigneeId: otherUserId });
  });

  it('rejects VIEWER updates to fields other than assignee', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    const service = new TaskService(repository as never);

    await expect(service.update(taskId, { title: 'No permitido' }, assigneeId, 'VIEWER')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Viewers can only update task assignee',
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects updates in an inactive project', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'PAUSED' });
    const service = new TaskService(repository as never);

    await expect(service.update(taskId, { title: 'No permitido' }, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 409,
      message: 'El proyecto está inactivo. Actívalo antes de modificar sus tareas',
    });
  });

  it('rejects updates for an unknown task and maps duplicate titles', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValueOnce(null);
    const service = new TaskService(repository as never);

    await expect(service.update(taskId, { title: 'Nueva' }, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Task not found',
    });

    repository.findById.mockResolvedValue(createTask());
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.update.mockRejectedValue(prismaError('P2002'));

    await expect(service.update(taskId, { title: 'Duplicada' }, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Ya existe una tarea con ese nombre en este proyecto',
    });
  });

  it('changes status and records the transition history', async () => {
    const repository = createRepositoryMock();
    const task = createTask();
    repository.findById.mockResolvedValue(task);
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.getCurrentStatus.mockResolvedValue({
      status: 'PENDING',
      creatorId,
      assigneeId,
    });
    repository.updateStatus.mockResolvedValue({ ...task, status: 'IN_PROGRESS' });
    const updatedTask = { ...task, status: 'IN_PROGRESS' };
    repository.findById.mockResolvedValueOnce(task).mockResolvedValueOnce(updatedTask);
    const service = new TaskService(repository as never);

    const result = await service.changeStatus(
      taskId,
      { status: 'IN_PROGRESS', comment: 'Inicio' },
      'VIEWER',
      assigneeId,
    );

    expect(repository.updateStatus).toHaveBeenCalledWith(taskId, 'IN_PROGRESS');
    expect(repository.createStatusChange).toHaveBeenCalledWith({
      taskId,
      fromStatus: 'PENDING',
      toStatus: 'IN_PROGRESS',
      comment: 'Inicio',
      changedBy: assigneeId,
    });
    expect(result).toBe(updatedTask);
  });

  it('rejects invalid status transitions', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.getCurrentStatus.mockResolvedValue({ status: 'PENDING', creatorId, assigneeId });
    const service = new TaskService(repository as never);

    await expect(
      service.changeStatus(taskId, { status: 'PENDING' }, 'ADMIN', creatorId),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Invalid task status transition',
    });
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it('restricts VIEWER status changes to creator or assignee', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.getCurrentStatus.mockResolvedValue({ status: 'PENDING', creatorId, assigneeId });
    const service = new TaskService(repository as never);

    await expect(
      service.changeStatus(taskId, { status: 'IN_PROGRESS' }, 'VIEWER', otherUserId),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only the task creator or assignee can change this task status',
    });
  });

  it('restricts VIEWER from transitions reserved for ADMIN', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.getCurrentStatus.mockResolvedValue({ status: 'PENDING', creatorId, assigneeId });
    const service = new TaskService(repository as never);

    await expect(
      service.changeStatus(taskId, { status: 'DONE' }, 'VIEWER', assigneeId),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Insufficient permissions for this task status transition',
    });
  });

  it('rejects status changes in inactive projects', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'PAUSED' });
    const service = new TaskService(repository as never);

    await expect(
      service.changeStatus(taskId, { status: 'IN_PROGRESS' }, 'ADMIN', creatorId),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'El proyecto está inactivo. Actívalo antes de modificar sus tareas',
    });
  });

  it('creates notes for an authorized user in an active project', async () => {
    const repository = createRepositoryMock();
    const task = createTask();
    const note = { id: 'note-1', content: 'Nota', taskId, authorId: creatorId };
    repository.findById.mockResolvedValue(task);
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'ACTIVE' });
    repository.createNote.mockResolvedValue(note);
    const service = new TaskService(repository as never);

    const result = await service.createNote(taskId, { content: 'Nota' }, creatorId, 'VIEWER');

    expect(repository.createNote).toHaveBeenCalledWith(taskId, creatorId, 'Nota');
    expect(result).toBe(note);
  });

  it('rejects notes from an unauthorized VIEWER or inactive project', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    const service = new TaskService(repository as never);

    await expect(
      service.createNote(taskId, { content: 'Nota' }, otherUserId, 'VIEWER'),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only the task creator or assignee can add notes',
    });

    repository.findById.mockResolvedValue(createTask());
    repository.findProjectById.mockResolvedValue({ id: projectId, status: 'PAUSED' });
    await expect(
      service.createNote(taskId, { content: 'Nota' }, creatorId, 'ADMIN'),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'El proyecto está inactivo. Actívalo antes de modificar sus tareas',
    });
  });

  it('finds notes for an existing task', async () => {
    const repository = createRepositoryMock();
    const notes = [{ id: 'note-1', content: 'Nota' }];
    repository.findById.mockResolvedValue(createTask());
    repository.findNotes.mockResolvedValue(notes);
    const service = new TaskService(repository as never);

    const result = await service.findNotes(taskId, creatorId, 'ADMIN');

    expect(repository.findNotes).toHaveBeenCalledWith(taskId);
    expect(result).toBe(notes);
  });

  it('deletes tasks only as ADMIN, including tasks with notes', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    repository.delete.mockResolvedValue(undefined);
    const service = new TaskService(repository as never);

    await service.delete(taskId, creatorId, 'ADMIN');

    expect(repository.delete).toHaveBeenCalledWith(taskId);
  });

  it('rejects non-admin deletion and deletion of unknown tasks', async () => {
    const repository = createRepositoryMock();
    const service = new TaskService(repository as never);

    await expect(service.delete(taskId, creatorId, 'VIEWER')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only administrators can delete tasks',
    });

    repository.findById.mockResolvedValue(null);
    await expect(service.delete(taskId, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Task not found',
    });
  });

  it('maps delete not-found errors and propagates other repository errors', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createTask());
    repository.delete.mockRejectedValue(prismaError('P2025'));
    const service = new TaskService(repository as never);

    await expect(service.delete(taskId, creatorId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Task not found',
    });

    const error = new Error('database unavailable');
    repository.delete.mockRejectedValue(error);
    await expect(service.delete(taskId, creatorId, 'ADMIN')).rejects.toBe(error);
  });
});
