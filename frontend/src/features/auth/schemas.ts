import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Ingresa un email válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
