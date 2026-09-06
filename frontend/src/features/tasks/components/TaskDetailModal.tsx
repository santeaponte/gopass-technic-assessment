import { useEffect, useRef } from 'react';

import type { Task, TaskPriority, TaskStatus } from '../types';

type TaskDetailModalProps = {
  task: Task;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
  onStatusDenied: () => void;
};

const statusLabels: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revisión',
  DONE: 'Completada',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

const editableStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

function formatDate(value: string | null): string {
  if (!value) {
    return 'Sin fecha';
  }

  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function TaskDetailModal({
  task,
  currentUserId,
  isAdmin,
  onClose,
  onEdit,
  onArchive,
  onChangeStatus,
  onStatusDenied,
}: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const canChangeStatus = isAdmin || task.creator.id === currentUserId || task.assignee?.id === currentUserId;
  const canArchive = isAdmin || task.creator?.id === currentUserId;
  const availableStatuses = editableStatuses;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    modalRef.current?.focus();

    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="task-detail-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={modalRef}
        className="task-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="project-modal-close" onClick={onClose} aria-label="Cerrar detalle de tarea">
          ×
        </button>

        <p className="tasks-kicker">Detalle de tarea</p>
        <h2 id="task-detail-title">{task.title}</h2>
        <p className="task-detail-description">{task.description || 'Sin descripción.'}</p>

        <dl className="task-detail-meta">
          <div>
            <dt>Estado</dt>
            <dd>
              {canChangeStatus ? (
                <select
                  className="task-detail-status-select"
                  value={task.status}
                  onChange={(event) => {
                    const nextStatus = event.target.value as TaskStatus;
                    if (nextStatus === 'DONE' && !isAdmin) {
                      onStatusDenied();
                      return;
                    }
                    onChangeStatus(task, nextStatus);
                  }}
                  aria-label="Cambiar estado de tarea"
                >
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>{statusLabels[status]}</option>
                  ))}
                </select>
              ) : statusLabels[task.status]}
            </dd>
          </div>
          <div>
            <dt>Prioridad</dt>
            <dd className={`task-priority task-priority-${task.priority.toLowerCase()}`}>
              {priorityLabels[task.priority]}
            </dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{formatDate(task.dueDate)}</dd>
          </div>
          <div>
            <dt>Creator</dt>
            <dd>{task.creator?.name ?? 'Sin creator'}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{task.assignee?.name ?? 'Sin asignar'}</dd>
          </div>
        </dl>

        <div className="task-detail-actions">
          {isAdmin && (
            <button type="button" className="secondary-button" onClick={() => onEdit(task)}>
              Editar
            </button>
          )}
          {canArchive && (
            <button type="button" className="danger-button" onClick={() => onArchive(task)}>
              Archivar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
