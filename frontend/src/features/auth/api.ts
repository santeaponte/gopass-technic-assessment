import { apiRequest } from '../../lib/api/client';
import type { LoginFormValues } from './schemas';
import type { LoginResponse } from './types';

export function login(values: LoginFormValues): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: values,
  });
}
