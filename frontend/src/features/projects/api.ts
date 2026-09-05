import { apiRequest } from '../../lib/api/client';
import type { Project, ProjectFormValues } from './types';

export function getProjects(search?: string): Promise<Project[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<Project[]>(`/projects${query}`);
}

export function getProject(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`);
}

export function createProject(values: ProjectFormValues): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: {
      name: values.name,
      description: values.description || undefined,
    },
  });
}

export function updateProject(id: string, values: ProjectFormValues): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: {
      name: values.name,
      description: values.description || undefined,
    },
  });
}

export function deleteProject(id: string): Promise<void> {
  return apiRequest<void>(`/projects/${id}`, {
    method: 'DELETE',
  });
}
