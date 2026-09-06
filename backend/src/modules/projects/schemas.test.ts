import { describe, expect, it } from 'vitest';

import { createProjectSchema, updateProjectSchema } from './schemas';

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
});
