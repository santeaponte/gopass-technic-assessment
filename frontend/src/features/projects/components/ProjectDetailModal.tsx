import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../../../lib/api/client';
import { createTask, getTasks, updateTask } from '../../tasks/api';
import { TaskForm } from '../../tasks/components/TaskForm';
import type { Task, TaskFormValues, TaskStatus } from '../../tasks/types';
import { getUsers } from '../../users/api';
import type { PublicUser } from '../../auth/types';
import type { Project } from '../types';
import { DescriptionPreview } from '../../../components/DescriptionPreview';
import { formatDate, getProjectDisplayStatus } from '../../../lib/date';
import { WarningModal } from '../../../components/WarningModal';

type ProjectDetailModalProps = {
  project: Project;
  canManage: boolean;
  canCreateTask: boolean;
  currentUserId: string;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onStatusChange: (project: Project) => void;
  onDelete: (project: Project) => void;
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

export function ProjectDetailModal({
  project,
  canManage,
  canCreateTask,
  currentUserId,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
}: ProjectDetailModalProps) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [isStatusWarningOpen, setIsStatusWarningOpen] = useState(false);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskEditFormOpen, setIsTaskEditFormOpen] = useState(false);
  const displayStatus = getProjectDisplayStatus(project.status, project.dueDate, tasks.map((task) => task.status));

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

  const handleEditTask = async (values: TaskFormValues): Promise<void> => {
    if (!selectedTask) {
      return;
    }

    setIsTaskSubmitting(true);
    setTaskError('');

    try {
      const updatedTask = await updateTask(selectedTask.id, project.id, values, !canManage);
      if (!updatedTask) {
        throw new Error('Task update returned no task');
      }
      setTasks((currentTasks) => currentTasks.map((task) => task.id === updatedTask.id ? updatedTask : task));
      setSelectedTask(updatedTask);
      setIsTaskEditFormOpen(false);
    } catch (requestError) {
      console.error(requestError);
      setTaskError(requestError instanceof ApiError ? requestError.message : 'No pudimos editar la tarea.');
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const taskFormValues = (task: Task): TaskFormValues => ({
    title: task.title,
    description: task.description ?? '',
    notes: task.notes ?? '',
    priority: task.priority,
    dueDate: task.dueDate?.slice(0, 10) ?? '',
    assigneeId: task.assignee?.id ?? '',
  });

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isTaskEditFormOpen) {
          setIsTaskEditFormOpen(false);
        } else if (selectedTask) {
          setSelectedTask(null);
        } else if (isTaskFormOpen || isStatusWarningOpen) {
          setIsTaskFormOpen(false);
          setIsStatusWarningOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    modalRef.current?.focus();

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isStatusWarningOpen, isTaskEditFormOpen, isTaskFormOpen, onClose, selectedTask]);

  return (
    <div
      className="project-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
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
                <li
                  key={task.id}
                  className="project-task-item"
                  tabIndex={0}
                  role="button"
                  onClick={() => navigate(`/projects/${encodeURIComponent(project.id)}/tasks`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/projects/${encodeURIComponent(project.id)}/tasks`);
                    }
                  }}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <DescriptionPreview
                      description={task.description}
                      title={task.title}
                      className="project-task-list-description"
                    />
                  </div>
                  <span className={`project-task-status project-task-status-${task.status.toLowerCase()}`}>
                    {statusLabels[task.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {canCreateTask && (
            <button type="button" className="project-create-task-button" onClick={() => { setTaskError(''); setIsTaskFormOpen(true); }}>
              + Agregar tarea
            </button>
          )}
          {!canCreateTask && project.status !== 'ACTIVE' && (
            <p className="form-error">El proyecto está inactivo. Actívalo para modificar sus tareas.</p>
          )}
        </section>

        <aside className="project-modal-info">
          <div className="project-modal-section-heading">
            <p className="projects-kicker">Proyecto</p>
            <h2 id="project-detail-title">{project.name}</h2>
          </div>
          <dl className="project-modal-meta">
            <div>
              <dt>Estado</dt>
              <dd className={`project-status-text project-status-text-${displayStatus.className}`}>{displayStatus.label}</dd>
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
            <div>
              <dt>Fecha de creación</dt>
              <dd>{formatDate(project.createdAt)}</dd>
            </div>
            <div>
              <dt>Fecha de entrega</dt>
              <dd>{project.dueDate ? formatDate(project.dueDate) : 'Sin fecha'}</dd>
            </div>
          </dl>
          <p className="project-modal-description-label">Descripción</p>
          <DescriptionPreview
            description={project.description}
            title={project.name}
            className="project-modal-description"
          />
          {canManage && (
            <div className="project-modal-actions">
              {project.status === 'ACTIVE' && (
                <button type="button" className="secondary-button" onClick={() => onEdit(project)}>
                  Editar
                </button>
              )}
              <button type="button" className="danger-button" onClick={() => setIsDeleteWarningOpen(true)}>
                Eliminar
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
      {selectedTask && (
        <div className="project-task-detail-backdrop" role="presentation" onMouseDown={() => setSelectedTask(null)}>
          <section
            className="project-task-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-task-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="project-modal-close" onClick={() => setSelectedTask(null)} aria-label="Cerrar detalle de tarea">
              ×
            </button>
            <p className="projects-kicker">Detalle de tarea</p>
            <h2 id="project-task-detail-title">{selectedTask.title}</h2>
            <dl className="project-task-detail-meta">
              <div><dt>Estado</dt><dd>{statusLabels[selectedTask.status]}</dd></div>
              <div>
                <dt>Prioridad</dt>
                <dd>
                  <span className={`task-priority task-priority-${selectedTask.priority.toLowerCase()}`}>
                    Prioridad {priorityLabels[selectedTask.priority]}
                  </span>
                </dd>
              </div>
              <div><dt>Fecha de creación</dt><dd>{formatDate(selectedTask.createdAt)}</dd></div>
              <div><dt>Fecha de entrega</dt><dd>{selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'Sin fecha'}</dd></div>
              <div><dt>Creador</dt><dd>{selectedTask.creator.name}</dd></div>
              <div><dt>Responsable</dt><dd>{selectedTask.assignee?.name ?? 'Sin asignar'}</dd></div>
            </dl>
            <p className="project-task-detail-label">Descripción</p>
            <DescriptionPreview
              description={selectedTask.description}
              title={selectedTask.title}
              className="project-task-detail-text"
            />
            <p className="project-task-detail-label">Notas</p>
            <DescriptionPreview
              description={selectedTask.notes}
              title={`Notas de ${selectedTask.title}`}
              className="project-task-detail-text"
              emptyLabel="Sin notas."
            />
            {project.status === 'ACTIVE' && (canManage || selectedTask.creator.id === currentUserId || selectedTask.assignee?.id === currentUserId) && (
              <div className="project-task-detail-actions">
                <button type="button" className="secondary-button" onClick={() => { setTaskError(''); setIsTaskEditFormOpen(true); }}>
                  {canManage ? 'Editar' : 'Editar notas'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      {isTaskEditFormOpen && selectedTask && (
        <div
          className="task-edit-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsTaskEditFormOpen(false);
            }
          }}
        >
          <div
            className="task-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-edit-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="project-modal-close" onClick={() => setIsTaskEditFormOpen(false)} aria-label="Cerrar edición de tarea">
              ×
            </button>
            <h2 id="task-edit-title">{canManage ? 'Editar tarea' : 'Notas de la tarea'}</h2>
            {taskError && <p className="form-error" role="alert">{taskError}</p>}
            <TaskForm
              key={selectedTask.id}
              initialValues={taskFormValues(selectedTask)}
              users={users}
              submitLabel="Guardar cambios"
              onSubmit={handleEditTask}
              onCancel={() => setIsTaskEditFormOpen(false)}
              isSubmitting={isTaskSubmitting}
              notesOnly={!canManage}
            />
          </div>
        </div>
      )}
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
      {isDeleteWarningOpen && (
        <WarningModal
          title="¿Eliminar proyecto?"
          message={`El proyecto "${project.name}" se eliminará permanentemente. Solo podrás eliminarlo si no tiene tareas asociadas.`}
          confirmLabel="Eliminar proyecto"
          onCancel={() => setIsDeleteWarningOpen(false)}
          onConfirm={() => {
            setIsDeleteWarningOpen(false);
            onDelete(project);
          }}
        />
      )}
    </div>
  );
}
