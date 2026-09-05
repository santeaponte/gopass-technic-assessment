import { z } from 'zod';

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(200, 'El nombre es demasiado largo.'),
  description: z
    .string()
    .trim()
    .max(5000, 'La descripción es demasiado larga.')
    .optional()
    .transform((value) => value ?? ''),
  startDate: z.string(),
  dueDate: z.string(),
}).refine(
  (values) => !values.startDate || !values.dueDate || values.startDate <= values.dueDate,
  {
    message: 'La fecha de inicio debe ser anterior o igual a la fecha de entrega.',
    path: ['dueDate'],
  },
);

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
