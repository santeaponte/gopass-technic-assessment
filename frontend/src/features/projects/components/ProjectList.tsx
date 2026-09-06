import type { Project } from '../types';
import { DescriptionPreview } from '../../../components/DescriptionPreview';
import { formatDate, getProjectDisplayStatus } from '../../../lib/date';

type ProjectListProps = {
  projects: Project[];
  onOpen: (project: Project) => void;
};

const priorityLabels: Record<Project['priority'], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export function ProjectList({ projects, onOpen }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="empty-state">No hay proyectos para mostrar.</p>;
  }

  return (
    <ul className="project-list">
      {projects.map((project) => (
        <li key={project.id} className="project-item">
          <button type="button" className="project-main" onClick={() => onOpen(project)}>
            {(() => {
              const displayStatus = getProjectDisplayStatus(project.status, project.dueDate);
              return (
            <span className="project-header-row">
              <span className="project-title">{project.name}</span>
              <span className={`project-status project-status-${displayStatus.className}`}>
                {displayStatus.label}
              </span>
            </span>
              );
            })()}

            <DescriptionPreview description={project.description} title={project.name} className="project-description" />

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
