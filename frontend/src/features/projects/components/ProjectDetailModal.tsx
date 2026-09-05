import { useEffect, useRef, useState } from 'react';

import { ApiError } from '../../../lib/api/client';
import { createTask, getTasks } from '../../tasks/api';
import { TaskForm } from '../../tasks/components/TaskForm';
import type { Task, TaskFormValues, TaskStatus } from '../../tasks/types';
import { getUsers } from '../../users/api';
import type { PublicUser } from '../../auth/types';
import type { Project } from '../types';

type ProjectDetailModalProps = {
  project: Project;
  canManage: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onStatusChange: (project: Project) => void;
};

const statusLabels: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revisión',
  DONE: 'Completada',
};

const priorityLabels: Record<Project['priority'], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

const projectStatusLabels: Record<Project['status'], string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Inactivo',
  IN_REVIEW: 'En revisión',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

function formatDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function ProjectDetailModal({
  project,
  canManage,
  onClose,
  onEdit,
  onStatusChange,
}: ProjectDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [isStatusWarningOpen, setIsStatusWarningOpen] = useState(false);

  useEffect(() => {
    const loadTasks = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError('');
        setTasks(await getTasks('', project.id));
      } catch (requestError) {
        console.error(requestError);
        setError(requestError instanceof ApiError ? requestError.message : 'No pudimos cargar las tareas.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadTasks();
  }, [project.id]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    void getUsers().then(setUsers).catch((requestError: unknown) => {
      console.error(requestError);
      setTaskError('No pudimos cargar los usuarios para asignar la tarea.');
    });
  }, [canManage]);

  const handleCreateTask = async (values: TaskFormValues): Promise<void> => {
    setIsTaskSubmitting(true);
    setTaskError('');

    try {
      const createdTask = await createTask(project.id, values);
      if (!createdTask) {
        throw new Error('Task creation returned no task');
      }
      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setIsTaskFormOpen(false);
    } catch (requestError) {
      console.error(requestError);
      setTaskError(requestError instanceof ApiError ? requestError.message : 'No pudimos crear la tarea.');
    } finally {
      setIsTaskSubmitting(false);
    }
  };

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
    <div className="project-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={modalRef}
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="project-modal-close" onClick={onClose} aria-label="Cerrar detalle">
          ×
        </button>

        <section className="project-modal-tasks" aria-labelledby="project-tasks-title">
          <div className="project-modal-section-heading">
            <p className="projects-kicker">Actividad</p>
            <h2 id="project-tasks-title">Tareas del proyecto</h2>
          </div>

          {isLoading && <p className="empty-state">Cargando tareas...</p>}
          {!isLoading && error && <p className="form-error" role="alert">{error}</p>}
          {!isLoading && !error && tasks.length === 0 && (
            <p className="empty-state">No hay tareas para mostrar.</p>
          )}
          {!isLoading && !error && tasks.length > 0 && (
            <ul className="project-task-list">
              {tasks.map((task) => (
                <li key={task.id} className="project-task-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.description || 'Sin descripción.'}</p>
                  </div>
                  <span className={`project-task-status project-task-status-${task.status.toLowerCase()}`}>
                    {statusLabels[task.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {canManage && (
            <button type="button" className="project-create-task-button" onClick={() => { setTaskError(''); setIsTaskFormOpen(true); }}>
              + Agregar tarea
            </button>
          )}
        </section>

        <aside className="project-modal-info">
          <div className="project-modal-section-heading">
            <p className="projects-kicker">Proyecto</p>
            <h2 id="project-detail-title">{project.name}</h2>
          </div>
          <p className="project-modal-description">{project.description || 'Sin descripción.'}</p>
          <dl className="project-modal-meta">
            <div>
              <dt>Estado</dt>
              <dd>{projectStatusLabels[project.status]}</dd>
            </div>
            <div>
              <dt>Prioridad</dt>
              <dd>
                <span className={`project-priority project-priority-${project.priority.toLowerCase()}`}>
                  {priorityLabels[project.priority]}
                </span>
              </dd>
            </div>
            <div>
              <dt>Propietario</dt>
              <dd>{project.owner.name}</dd>
            </div>
            {project.dueDate && (
              <div>
                <dt>Entrega</dt>
                <dd>{formatDate(project.dueDate)}</dd>
              </div>
            )}
          </dl>
          {canManage && (
            <div className="project-modal-actions">
              <button type="button" className="secondary-button" onClick={() => onEdit(project)}>
                Editar
              </button>
              <button
                type="button"
                className={`project-status-action ${project.status === 'ACTIVE' ? 'project-status-action-deactivate' : 'project-status-action-activate'}`}
                onClick={() => setIsStatusWarningOpen(true)}
              >
                {project.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          )}
        </aside>
      </div>
      {isTaskFormOpen && (
        <div className="task-create-modal-backdrop" role="presentation" onMouseDown={() => setIsTaskFormOpen(false)}>
          <div
            className="task-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-create-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="project-modal-close" onClick={() => setIsTaskFormOpen(false)} aria-label="Cerrar formulario de tarea">
              ×
            </button>
            <h2 id="task-create-title">Nueva tarea</h2>
            {taskError && <p className="form-error" role="alert">{taskError}</p>}
            <TaskForm
              users={users}
              submitLabel="Crear tarea"
              onSubmit={handleCreateTask}
              onCancel={() => setIsTaskFormOpen(false)}
              isSubmitting={isTaskSubmitting}
            />
          </div>
        </div>
      )}
      {isStatusWarningOpen && (
        <div className="project-confirm-backdrop" role="presentation" onMouseDown={() => setIsStatusWarningOpen(false)}>
          <div
            className="project-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="project-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="projects-kicker">Cambio de estado</p>
            <h2 id="project-confirm-title">
              {project.status === 'ACTIVE' ? '¿Desactivar proyecto?' : '¿Activar proyecto?'}
            </h2>
            <p>
              {project.status === 'ACTIVE'
                ? `El proyecto "${project.name}" quedará inactivo, pero sus datos se conservarán.`
                : `El proyecto "${project.name}" volverá a estar activo.`}
            </p>
            <div className="project-confirm-actions">
              <button type="button" className="secondary-button" onClick={() => setIsStatusWarningOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className={project.status === 'ACTIVE' ? 'project-status-action project-status-action-deactivate' : 'project-status-action project-status-action-activate'}
                onClick={() => {
                  setIsStatusWarningOpen(false);
                  onStatusChange(project);
                }}
              >
                {project.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
