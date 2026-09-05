import { apiRequest } from '../../lib/api/client';
import type { PublicUser } from '../auth/types';

export function getUsers(): Promise<PublicUser[]> {
  return apiRequest<PublicUser[]>('/users');
}
