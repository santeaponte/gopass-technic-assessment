import { describe, expect, it } from 'vitest';

import {
  createProjectSchema,
  projectIdSchema,
  projectSearchSchema,
  updateProjectSchema,
} from './schemas';

describe('createProjectSchema', () => {
  it('accepts a project with an ordered date range', () => {
    const result = createProjectSchema.safeParse({
      name: 'Proyecto de prueba',
      startDate: '2026-09-01',
      dueDate: '2026-09-30',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a due date before the start date', () => {
    const result = createProjectSchema.safeParse({
      name: 'Proyecto de prueba',
      startDate: '2026-09-30',
      dueDate: '2026-09-01',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty project name', () => {
    const result = createProjectSchema.safeParse({ name: '   ' });

    expect(result.success).toBe(false);
  });

  it('accepts the minimum and maximum project name lengths', () => {
    expect(createProjectSchema.safeParse({ name: 'A' }).success).toBe(true);
    expect(createProjectSchema.safeParse({ name: 'A'.repeat(200) }).success).toBe(true);
  });

  it('rejects a project name above the maximum length', () => {
    expect(createProjectSchema.safeParse({ name: 'A'.repeat(201) }).success).toBe(false);
  });

  it('rejects invalid dates', () => {
    expect(createProjectSchema.safeParse({ name: 'Proyecto', startDate: 'not-a-date' }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: 'Proyecto', dueDate: '2026-13-01' }).success).toBe(false);
  });

  it('accepts valid statuses, priorities, and equal boundary dates', () => {
    const result = createProjectSchema.safeParse({
      name: 'Proyecto',
      status: 'COMPLETED',
      priority: 'HIGH',
      startDate: '2026-09-01',
      dueDate: '2026-09-01',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid enum values', () => {
    expect(createProjectSchema.safeParse({ name: 'Proyecto', status: 'FINISHED' }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: 'Proyecto', priority: 'URGENT' }).success).toBe(false);
  });

  it('strips unknown fields from valid project data', () => {
    const result = createProjectSchema.parse({ name: 'Proyecto', ownerId: 'unexpected' });

    expect(result).not.toHaveProperty('ownerId');
  });

  it('rejects an incomplete project payload', () => {
    expect(createProjectSchema.safeParse({}).success).toBe(false);
  });
});

describe('updateProjectSchema', () => {
  it('rejects an empty update', () => {
    const result = updateProjectSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('accepts a partial update', () => {
    const result = updateProjectSchema.safeParse({ priority: 'HIGH' });

    expect(result.success).toBe(true);
  });

  it('accepts valid update enums and dates', () => {
    const result = updateProjectSchema.safeParse({
      status: 'IN_REVIEW',
      priority: 'LOW',
      startDate: '2026-09-01',
      dueDate: '2026-09-15',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid update enums, dates, and inverted dates', () => {
    expect(updateProjectSchema.safeParse({ status: 'FINISHED' }).success).toBe(false);
    expect(updateProjectSchema.safeParse({ dueDate: 'not-a-date' }).success).toBe(false);
    expect(
      updateProjectSchema.safeParse({
        startDate: '2026-09-15',
        dueDate: '2026-09-01',
      }).success,
    ).toBe(false);
  });

  it('rejects an update containing only unknown fields', () => {
    expect(updateProjectSchema.safeParse({ ownerId: 'unexpected' }).success).toBe(false);
  });

  it('accepts the minimum and maximum update name lengths', () => {
    expect(updateProjectSchema.safeParse({ name: 'A' }).success).toBe(true);
    expect(updateProjectSchema.safeParse({ name: 'A'.repeat(200) }).success).toBe(true);
  });

  it('rejects an update name above the maximum length', () => {
    expect(updateProjectSchema.safeParse({ name: 'A'.repeat(201) }).success).toBe(false);
  });
});

describe('projectIdSchema', () => {
  it('accepts a valid UUID', () => {
    expect(
      projectIdSchema.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' }).success,
    ).toBe(true);
  });

  it('rejects an invalid UUID', () => {
    expect(projectIdSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('projectSearchSchema', () => {
  it('accepts an omitted search and trims valid search text', () => {
    expect(projectSearchSchema.parse({})).toEqual({});
    expect(projectSearchSchema.parse({ search: '  web app  ' })).toEqual({ search: 'web app' });
  });

  it('rejects empty search and search text above the maximum length', () => {
    expect(projectSearchSchema.safeParse({ search: '   ' }).success).toBe(false);
    expect(projectSearchSchema.safeParse({ search: 'a'.repeat(201) }).success).toBe(false);
  });
});
