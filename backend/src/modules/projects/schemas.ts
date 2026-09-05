import { z } from 'zod';

const projectStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']);
const dateSchema = z.coerce.date();

export const projectIdSchema = z.object({
	id: z.string().uuid(),
});

export const projectSearchSchema = z.object({
	search: z.string().trim().min(1).max(200).optional(),
});

export const createProjectSchema = z.object({
	name: z.string().trim().min(1).max(200),
	description: z.string().trim().max(5000).optional(),
	status: projectStatusSchema.optional(),
	dueDate: dateSchema.optional(),
});

export const updateProjectSchema = z
	.object({
		name: z.string().trim().min(1).max(200).optional(),
		description: z.string().trim().max(5000).optional(),
		status: projectStatusSchema.optional(),
		dueDate: dateSchema.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectSearchInput = z.infer<typeof projectSearchSchema>;
