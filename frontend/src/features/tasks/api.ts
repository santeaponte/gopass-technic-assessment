import { apiRequest } from '../../lib/api/client';
import type { Task, TaskFormValues, ChangeTaskStatusValues, TaskNote } from './types';

export function getTasks(search?: string, projectId?: string): Promise<Task[]> {
  const query = new URLSearchParams();

  if (search) {
    query.set('search', search);
  }

  if (projectId) {
    query.set('projectId', projectId);
  }

  const queryString = query.toString();
  return apiRequest<Task[]>(`/tasks${queryString ? `?${queryString}` : ''}`);
}

export function createTask(projectId: string, values: TaskFormValues): Promise<Task | null> {
  return apiRequest<Task | null>('/tasks', {
    method: 'POST',
    body: {
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      projectId,
      dueDate: values.dueDate || undefined,
      assigneeId: values.assigneeId || undefined,
    },
  });
}

export function updateTask(
  id: string,
  projectId: string,
  values: TaskFormValues,
): Promise<Task | null> {
  return apiRequest<Task | null>(`/tasks/${id}`, {
    method: 'PATCH',
    body: {
      title: values.title,
      description: values.description || null,
      priority: values.priority,
      projectId,
      dueDate: values.dueDate || null,
      assigneeId: values.assigneeId || null,
    },
  });
}

export function changeTaskStatus(id: string, values: ChangeTaskStatusValues): Promise<Task | null> {
  return apiRequest<Task | null>(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: values,
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export function getTaskNotes(taskId: string): Promise<TaskNote[]> {
  return apiRequest<TaskNote[]>(`/tasks/${taskId}/notes`);
}

export function createTaskNote(taskId: string, content: string): Promise<TaskNote> {
  return apiRequest<TaskNote>(`/tasks/${taskId}/notes`, {
    method: 'POST',
    body: { content },
  });
}
