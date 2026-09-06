import type { TaskStatus } from './types';

const validNextStatuses: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'IN_REVIEW', 'DONE'],
  IN_PROGRESS: ['PENDING', 'IN_REVIEW', 'DONE'],
  IN_REVIEW: ['PENDING', 'IN_PROGRESS', 'DONE'],
  DONE: ['PENDING', 'IN_PROGRESS', 'IN_REVIEW'],
};

export function canTransitionTaskStatus(
  currentStatus: TaskStatus,
  nextStatus: TaskStatus,
): boolean {
  return validNextStatuses[currentStatus].includes(nextStatus);
}

export function isViewerStatusTransitionAllowed(
  currentStatus: TaskStatus,
  nextStatus: TaskStatus,
): boolean {
  return currentStatus !== 'DONE' && nextStatus !== 'DONE';
}
