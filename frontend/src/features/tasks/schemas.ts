import { z } from 'zod';

const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.').max(200, 'El título es demasiado largo.'),
  description: z.string().trim(),
  notes: z.string().trim().max(5000, 'Las notas son demasiado largas.'),
  priority: taskPrioritySchema,
  dueDate: z.string(),
  assigneeId: z.string(),
});

export const changeTaskStatusSchema = z.object({
  status: taskStatusSchema,
  comment: z.string().trim().max(2000, 'El comentario es demasiado largo.').optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
