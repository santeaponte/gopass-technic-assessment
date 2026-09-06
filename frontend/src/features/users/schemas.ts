import { z } from 'zod';

export const createViewerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120, 'El nombre es demasiado largo.'),
  email: z.string().trim().email('Ingresa un email válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128, 'La contraseña es demasiado larga.'),
});

export type CreateViewerValues = z.infer<typeof createViewerSchema>;
