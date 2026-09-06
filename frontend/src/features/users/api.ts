import { apiRequest } from '../../lib/api/client';
import type { PublicUser } from '../auth/types';
import type { CreateUserValues } from './schemas';

export function getUsers(): Promise<PublicUser[]> {
  return apiRequest<PublicUser[]>('/users');
}

export function createUser(values: CreateUserValues): Promise<PublicUser> {
  return apiRequest<PublicUser>('/users', {
    method: 'POST',
    body: values,
  });
}

export function updateUserStatus(id: string, isActive: boolean): Promise<PublicUser> {
  return apiRequest<PublicUser>(`/users/${id}/status`, {
    method: 'PATCH',
    body: { isActive },
  });
}
