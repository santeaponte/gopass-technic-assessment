import { z } from 'zod';

const projectStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']);
const projectPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const dateSchema = z.coerce.date();

const projectDatesSchema = (data: { startDate?: Date; dueDate?: Date }) =>
	!data.startDate || !data.dueDate || data.startDate <= data.dueDate;

export const projectIdSchema = z.object({
	id: z.string().uuid(),
});

export const projectSearchSchema = z.object({
	search: z.string().trim().min(1).max(200).optional(),
});

export const createProjectSchema = z.object({
	name: z.string().trim().min(1).max(200),
	description: z.string().trim().optional(),
	status: projectStatusSchema.optional(),
	priority: projectPrioritySchema.optional(),
	startDate: dateSchema.optional(),
	dueDate: dateSchema.optional(),
}).refine(projectDatesSchema, {
	message: 'startDate must be before or equal to dueDate',
	path: ['dueDate'],
});

export const updateProjectSchema = z
	.object({
		name: z.string().trim().min(1).max(200).optional(),
		description: z.string().trim().optional(),
		status: projectStatusSchema.optional(),
		priority: projectPrioritySchema.optional(),
		startDate: dateSchema.optional(),
		dueDate: dateSchema.optional(),
	})
	.refine(projectDatesSchema, {
		message: 'startDate must be before or equal to dueDate',
		path: ['dueDate'],
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectSearchInput = z.infer<typeof projectSearchSchema>;
