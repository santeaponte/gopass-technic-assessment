import { useEffect, useRef, useState } from 'react';

import { ApiError } from '../../../lib/api/client';
import { getTasks } from '../../tasks/api';
import type { Task, TaskStatus } from '../../tasks/types';
import type { Project } from '../types';

type ProjectDetailModalProps = {
  project: Project;
  canManage: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

const statusLabels: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revisión',
  DONE: 'Completada',
};

export function ProjectDetailModal({
  project,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: ProjectDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
              <dd>{project.status.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt>Propietario</dt>
              <dd>{project.owner.name}</dd>
            </div>
            {project.dueDate && (
              <div>
                <dt>Entrega</dt>
                <dd>{project.dueDate}</dd>
              </div>
            )}
          </dl>
          {canManage && (
            <div className="project-modal-actions">
              <button type="button" className="secondary-button" onClick={() => onEdit(project)}>
                Editar
              </button>
              <button type="button" className="danger-button" onClick={() => onDelete(project)}>
                Eliminar
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
