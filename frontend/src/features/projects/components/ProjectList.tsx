import type { Project } from '../types';

type ProjectListProps = {
  projects: Project[];
  canManage: boolean;
  onOpen: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

const statusLabels: Record<Project['status'], string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  IN_REVIEW: 'En revisión',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export function ProjectList({ projects, canManage, onOpen, onEdit, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="empty-state">No hay proyectos para mostrar.</p>;
  }

  return (
    <ul className="project-list">
      {projects.map((project) => (
        <li key={project.id} className="project-item">
          <button type="button" className="project-main" onClick={() => onOpen(project)}>
            <span className="project-header-row">
              <span className="project-title">{project.name}</span>
              <span className={`project-status project-status-${project.status.toLowerCase()}`}>
                {statusLabels[project.status]}
              </span>
            </span>

            <span className="project-description">
              {project.description || 'Sin descripción.'}
            </span>

            <span className="project-meta">
              <span>Propietario: {project.owner.name}</span>
              {project.dueDate && <span>Entrega: {project.dueDate}</span>}
            </span>
            <span className="project-open-label">Ver tareas <span aria-hidden="true">→</span></span>
          </button>

          {canManage && (
            <div className="project-actions">
              <button type="button" className="secondary-button" onClick={() => onEdit(project)}>
                Editar
              </button>
              <button type="button" className="danger-button" onClick={() => onDelete(project)}>
                Eliminar
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
