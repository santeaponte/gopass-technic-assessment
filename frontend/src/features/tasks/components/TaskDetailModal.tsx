import { useEffect, useRef, useState } from 'react';

import type { Task, TaskPriority, TaskStatus } from '../types';
import type { TaskFormValues } from '../schemas';
import { TaskForm } from './TaskForm';
import { TaskNotes } from './TaskNotes';
import { formatDate } from '../../../lib/date';
import { DescriptionPreview } from '../../../components/DescriptionPreview';
import { WarningModal } from '../../../components/WarningModal';

type TaskDetailModalProps = {
  task: Task;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  users: import('../../auth/types').PublicUser[];
  isSubmitting: boolean;
  error: string;
  onEdit: (task: Task, values: TaskFormValues) => Promise<void>;
  onDelete: (task: Task) => void;
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

export function TaskDetailModal({
  task,
  currentUserId,
  isAdmin,
  users,
  isSubmitting,
  error,
  onClose,
  onEdit,
  onDelete,
  onChangeStatus,
  onStatusDenied,
}: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const isProjectActive = task.project.status === 'ACTIVE';
  const canChangeStatus = isProjectActive && (isAdmin || task.creator.id === currentUserId || task.assignee?.id === currentUserId);
  const canAddNotes = isProjectActive && (isAdmin || task.creator.id === currentUserId || task.assignee?.id === currentUserId);
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
    <>
    <div
      className="task-detail-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
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

        <p className="tasks-kicker">
          Detalle de tarea · <span className="task-detail-project">Proyecto: {task.project.name}</span>
        </p>
        <h2 id="task-detail-title">{task.title}</h2>

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
            <dt>Fecha de creación</dt>
            <dd>{formatDate(task.createdAt)}</dd>
          </div>
          <div>
            <dt>Fecha de entrega</dt>
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

        <p className="task-detail-description-label">Descripción</p>
        <DescriptionPreview description={task.description} title={task.title} className="task-detail-description" />

        <TaskNotes taskId={task.id} canAdd={canAddNotes} />

        <div className="task-detail-actions">
          {isAdmin && isProjectActive && (
            <button type="button" className="secondary-button" onClick={() => setIsEditOpen(true)}>
              Editar
            </button>
          )}
          {isAdmin && isProjectActive && (
            <button type="button" className="danger-button" onClick={() => setIsDeleteWarningOpen(true)}>
              Eliminar
            </button>
          )}
        </div>
        {isDeleteWarningOpen && (
          <WarningModal
            title="¿Eliminar tarea?"
            message={`La tarea "${task.title}" se eliminará permanentemente y no podrás recuperarla.`}
            confirmLabel="Eliminar tarea"
            onCancel={() => setIsDeleteWarningOpen(false)}
            onConfirm={() => {
              setIsDeleteWarningOpen(false);
              onDelete(task);
            }}
          />
        )}
      </div>
    </div>
    {isEditOpen && isProjectActive && (
      <div className="task-edit-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsEditOpen(false);
        }
      }}>
        <div className="task-create-modal" role="dialog" aria-modal="true" aria-labelledby="task-edit-title" onMouseDown={(event) => event.stopPropagation()}>
          <button type="button" className="project-modal-close" onClick={() => setIsEditOpen(false)} aria-label="Cerrar edición de tarea">×</button>
          <h2 id="task-edit-title">Editar tarea</h2>
          {error && <p className="form-error" role="alert">{error}</p>}
          <TaskForm
            initialValues={{
              title: task.title,
              description: task.description ?? '',
              priority: task.priority,
              dueDate: task.dueDate?.slice(0, 10) ?? '',
              assigneeId: task.assignee?.id ?? '',
            }}
            users={users}
            submitLabel="Guardar cambios"
            onSubmit={async (values) => {
              await onEdit(task, values);
              setIsEditOpen(false);
            }}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    )}
    </>
  );
}
