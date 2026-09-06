import { z } from 'zod';

export const userIdSchema = z.object({
	id: z.string().uuid(),
});

export const createViewerSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: z.string().trim().email().transform((email) => email.toLowerCase()),
	password: z.string().min(8).max(128),
}).strict();

export type CreateViewerInput = z.infer<typeof createViewerSchema>;
