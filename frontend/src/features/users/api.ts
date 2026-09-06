import { apiRequest } from '../../lib/api/client';
import type { PublicUser } from '../auth/types';
import type { CreateViewerValues } from './schemas';

export function getUsers(): Promise<PublicUser[]> {
  return apiRequest<PublicUser[]>('/users');
}

export function createViewer(values: CreateViewerValues): Promise<PublicUser> {
  return apiRequest<PublicUser>('/users', {
    method: 'POST',
    body: values,
  });
}
