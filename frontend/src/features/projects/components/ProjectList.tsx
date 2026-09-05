import type { Project } from '../types';

type ProjectListProps = {
  projects: Project[];
  canManage: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

export function ProjectList({ projects, canManage, onEdit, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="empty-state">No hay proyectos para mostrar.</p>;
  }

  return (
    <ul className="project-list">
      {projects.map((project) => (
        <li key={project.id} className="project-item">
          <div className="project-main">
            <div className="project-header-row">
              <h3>{project.name}</h3>
              <span className="project-status">{project.status}</span>
            </div>

            <p className="project-description">
              {project.description || 'Sin descripción.'}
            </p>

            <div className="project-meta">
              <span>Propietario: {project.owner.name}</span>
              <span>Rol: {project.owner.role}</span>
            </div>
          </div>

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
