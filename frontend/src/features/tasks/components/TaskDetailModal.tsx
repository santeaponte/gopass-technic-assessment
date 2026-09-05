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

const nextStatuses: Record<TaskStatus, TaskStatus | null> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'IN_REVIEW',
  IN_REVIEW: 'DONE',
  DONE: null,
};

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
}: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const canChangeStatus = isAdmin || task.assignee?.id === currentUserId;
  const canArchive = isAdmin || task.creator?.id === currentUserId;
  const nextStatus = nextStatuses[task.status];

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
            <dd>{statusLabels[task.status]}</dd>
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
          {canChangeStatus && nextStatus && (
            <button type="button" className="primary-button" onClick={() => onChangeStatus(task, nextStatus)}>
              Pasar a {statusLabels[nextStatus]}
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
