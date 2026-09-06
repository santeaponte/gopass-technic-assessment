import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectService } from './service';
import type { ProjectRecord } from './repository';

const projectId = '123e4567-e89b-12d3-a456-426614174000';
const ownerId = '123e4567-e89b-12d3-a456-426614174001';

const createProject = (overrides: Partial<ProjectRecord> = {}): ProjectRecord => ({
  id: projectId,
  name: 'Proyecto',
  description: 'Descripción',
  status: 'ACTIVE',
  priority: 'MEDIUM',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  dueDate: new Date('2026-09-30T00:00:00.000Z'),
  owner: {
    id: ownerId,
    name: 'Ana',
    email: 'ana@example.com',
    role: 'ADMIN',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  ...overrides,
});

const createRepositoryMock = () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Database constraint failed', {
    code,
    clientVersion: '7.10.0',
  });

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a project and assigns the authenticated owner', async () => {
    const repository = createRepositoryMock();
    const project = createProject();
    repository.create.mockResolvedValue(project);
    const service = new ProjectService(repository as never);
    const input = {
      name: 'Proyecto',
      priority: 'HIGH' as const,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      dueDate: new Date('2026-09-30T00:00:00.000Z'),
    };

    const result = await service.create(input, ownerId);

    expect(repository.create).toHaveBeenCalledWith({ ...input, ownerId });
    expect(result).toBe(project);
  });

  it('maps duplicate project names to a conflict error', async () => {
    const repository = createRepositoryMock();
    repository.create.mockRejectedValue(prismaError('P2002'));
    const service = new ProjectService(repository as never);

    await expect(service.create({ name: 'Proyecto' }, ownerId)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Project name is already in use',
    });
  });

  it('maps a missing project owner to a not-found error', async () => {
    const repository = createRepositoryMock();
    repository.create.mockRejectedValue(prismaError('P2025'));
    const service = new ProjectService(repository as never);

    await expect(service.create({ name: 'Proyecto' }, ownerId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Project owner not found',
    });
  });

  it('propagates repository errors not handled by the service', async () => {
    const repository = createRepositoryMock();
    const error = new Error('database unavailable');
    repository.create.mockRejectedValue(error);
    const service = new ProjectService(repository as never);

    await expect(service.create({ name: 'Proyecto' }, ownerId)).rejects.toBe(error);
  });

  it('lists projects with search and role visibility parameters', async () => {
    const repository = createRepositoryMock();
    const projects = [createProject()];
    repository.findAll.mockResolvedValue(projects);
    const service = new ProjectService(repository as never);

    const result = await service.findAll('web', ownerId, 'VIEWER');

    expect(repository.findAll).toHaveBeenCalledWith('web', ownerId, 'VIEWER');
    expect(result).toBe(projects);
  });

  it('lists projects without a search term for an administrator', async () => {
    const repository = createRepositoryMock();
    repository.findAll.mockResolvedValue([]);
    const service = new ProjectService(repository as never);

    await service.findAll(undefined, ownerId, 'ADMIN');

    expect(repository.findAll).toHaveBeenCalledWith(undefined, ownerId, 'ADMIN');
  });

  it('returns an existing project', async () => {
    const repository = createRepositoryMock();
    const project = createProject();
    repository.findById.mockResolvedValue(project);
    const service = new ProjectService(repository as never);

    const result = await service.findById(projectId, ownerId, 'ADMIN');

    expect(repository.findById).toHaveBeenCalledWith(projectId, ownerId, 'ADMIN');
    expect(result).toBe(project);
  });

  it('rejects an unknown project when retrieving it', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const service = new ProjectService(repository as never);

    await expect(service.findById(projectId, ownerId, 'ADMIN')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Project not found',
    });
  });

  it('updates an active project', async () => {
    const repository = createRepositoryMock();
    const project = createProject();
    repository.findById.mockResolvedValue(project);
    repository.update.mockResolvedValue({ ...project, name: 'Nuevo nombre' });
    const service = new ProjectService(repository as never);

    const result = await service.update(projectId, { name: 'Nuevo nombre' });

    expect(repository.update).toHaveBeenCalledWith(projectId, { name: 'Nuevo nombre' });
    expect(result.name).toBe('Nuevo nombre');
  });

  it('rejects updates for an unknown project', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const service = new ProjectService(repository as never);

    await expect(service.update(projectId, { name: 'Nuevo nombre' })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Project not found',
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects inverted dates during update', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createProject());
    const service = new ProjectService(repository as never);

    await expect(
      service.update(projectId, {
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        dueDate: new Date('2026-09-01T00:00:00.000Z'),
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: 'La fecha de inicio debe ser anterior o igual a la fecha de entrega',
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('allows an inactive project to be reactivated without other changes', async () => {
    const repository = createRepositoryMock();
    const project = createProject({ status: 'PAUSED' });
    repository.findById.mockResolvedValue(project);
    repository.update.mockResolvedValue({ ...project, status: 'ACTIVE' });
    const service = new ProjectService(repository as never);

    await service.update(projectId, { status: 'ACTIVE' });

    expect(repository.update).toHaveBeenCalledWith(projectId, { status: 'ACTIVE' });
  });

  it('rejects changes to an inactive project unless it is only reactivated', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createProject({ status: 'PAUSED' }));
    const service = new ProjectService(repository as never);

    await expect(service.update(projectId, { name: 'No permitido' })).rejects.toMatchObject({
      statusCode: 409,
      message: 'El proyecto está inactivo. Actívalo antes de modificarlo',
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('maps duplicate names during update to a conflict error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createProject());
    repository.update.mockRejectedValue(prismaError('P2002'));
    const service = new ProjectService(repository as never);

    await expect(service.update(projectId, { name: 'Duplicado' })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Project name is already in use',
    });
  });

  it('deletes an existing project through the repository', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createProject());
    repository.delete.mockResolvedValue(undefined);
    const service = new ProjectService(repository as never);

    await service.delete(projectId);

    expect(repository.delete).toHaveBeenCalledWith(projectId);
  });

  it('allows deletion of an existing project regardless of its tasks', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(createProject());
    repository.delete.mockResolvedValue(undefined);
    const service = new ProjectService(repository as never);

    await service.delete(projectId);

    expect(repository.delete).toHaveBeenCalledOnce();
  });

  it('rejects deletion of an unknown project', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const service = new ProjectService(repository as never);

    await expect(service.delete(projectId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Project not found',
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
