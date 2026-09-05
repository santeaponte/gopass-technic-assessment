import type { Project } from '../types';

type ProjectListProps = {
  projects: Project[];
  onOpen: (project: Project) => void;
};

const statusLabels: Record<Project['status'], string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Inactivo',
  IN_REVIEW: 'En revisión',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const priorityLabels: Record<Project['priority'], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

function formatDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function ProjectList({ projects, onOpen }: ProjectListProps) {
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
              <span className="project-meta-secondary">
                <span className={`project-priority project-priority-${project.priority.toLowerCase()}`}>
                  Prioridad {priorityLabels[project.priority]}
                </span>
                <span className="project-meta-due-date">
                  Entrega: {project.dueDate ? formatDate(project.dueDate) : ' '}
                </span>
              </span>
            </span>
          </button>

        </li>
      ))}
    </ul>
  );
}
