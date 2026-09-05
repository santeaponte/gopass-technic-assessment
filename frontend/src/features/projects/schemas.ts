import { z } from 'zod';

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(200, 'El nombre es demasiado largo.'),
  description: z
    .string()
    .trim()
    .max(5000, 'La descripción es demasiado larga.')
    .optional()
    .transform((value) => value ?? ''),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
