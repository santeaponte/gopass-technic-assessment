import { z } from 'zod';

export const userIdSchema = z.object({
	id: z.string().uuid(),
});

export const createUserSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: z.string().trim().email().transform((email) => email.toLowerCase()),
	password: z.string().min(8).max(128),
	role: z.enum(['ADMIN', 'VIEWER']).default('VIEWER'),
}).strict();

export const updateUserStatusSchema = z.object({
	isActive: z.boolean(),
}).strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
