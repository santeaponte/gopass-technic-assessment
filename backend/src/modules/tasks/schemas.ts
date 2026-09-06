import { z } from 'zod';

const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
const dateSchema = z.coerce.date();

export const taskIdSchema = z.object({
	id: z.string().uuid(),
});

export const taskSearchSchema = z.object({
	search: z.string().trim().min(1).max(200).optional(),
	projectId: z.string().uuid().optional(),
});

export const createTaskSchema = z.object({
	title: z.string().trim().min(1).max(200),
	description: z.string().trim().nullable().optional(),
	notes: z.string().trim().max(5000).nullable().optional(),
	priority: taskPrioritySchema.optional(),
	projectId: z.string().uuid(),
	dueDate: dateSchema.nullable().optional(),
	assigneeId: z.string().uuid().nullable().optional(),
}).strict();

export const updateTaskSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().nullable().optional(),
	notes: z.string().trim().max(5000).nullable().optional(),
	priority: taskPrioritySchema.optional(),
	projectId: z.string().uuid().optional(),
	creatorId: z.string().uuid().optional(),
	dueDate: dateSchema.nullable().optional(),
	assigneeId: z.string().uuid().nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
	message: 'At least one field is required',
});

export const changeTaskStatusSchema = z.object({
	status: taskStatusSchema,
	comment: z.string().trim().max(2000).nullable().optional(),
}).strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ChangeTaskStatusInput = z.infer<typeof changeTaskStatusSchema>;
export type TaskStatusValue = z.infer<typeof taskStatusSchema>;
