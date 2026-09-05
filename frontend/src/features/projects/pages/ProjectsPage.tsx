import { useCallback, useEffect, useState, useRef } from 'react';

import { useAuth } from '../../auth/context/useAuth';
import { ApiError } from '../../../lib/api/client';
import { createProject, getProjects, updateProject, updateProjectStatus } from '../api';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectList } from '../components/ProjectList';
import type { Project, ProjectFormValues } from '../types';

const initialFormValues: ProjectFormValues = {
  name: '',
  description: '',
  priority: 'MEDIUM',
  startDate: '',
  dueDate: '',
};

function sortProjectsByDueDate(projects: Project[]): Project[] {
  return [...projects].sort((first, second) => {
    if (!first.dueDate) return 1;
    if (!second.dueDate) return -1;
    return first.dueDate.localeCompare(second.dueDate);
  });
}

export function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const projectFormModalRef = useRef<HTMLDivElement>(null);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
    setFormError('');
  };

  useEffect(() => {
    if (!isFormOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeForm();
      }
    };

    document.addEventListener('keydown', handleEscape);
    projectFormModalRef.current?.focus();

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFormOpen]);

  const loadProjects = useCallback(async (term: string): Promise<void> => {
    try {
      const nextProjects = await getProjects(term.trim());
      setError('');
      setProjects(sortProjectsByDueDate(nextProjects));
    } catch (requestError) {
      console.error(requestError);
      setError('No pudimos cargar los proyectos. Inténtalo de nuevo.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      void loadProjects(search);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [loadProjects, search]);

  const handleCreate = async (values: ProjectFormValues): Promise<void> => {
    if (!isAdmin) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const createdProject = await createProject(values);
      setProjects((currentProjects) => sortProjectsByDueDate([createdProject, ...currentProjects]));
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (requestError) {
      console.error(requestError);
      if (requestError instanceof ApiError) {
        setFormError(requestError.message || 'No pudimos crear el proyecto.');
      } else {
        setFormError('No pudimos crear el proyecto.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (values: ProjectFormValues): Promise<void> => {
    if (!editingProject || !isAdmin) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const updatedProject = await updateProject(editingProject.id, values);
      setProjects((currentProjects) => sortProjectsByDueDate(
        currentProjects.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
      ));
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (requestError) {
      console.error(requestError);
      if (requestError instanceof ApiError) {
        setFormError(requestError.message || 'No pudimos editar el proyecto.');
      } else {
        setFormError('No pudimos editar el proyecto.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (project: Project): Promise<Project | null> => {
    if (!isAdmin) {
      return null;
    }

    const isActive = project.status === 'ACTIVE';
    const nextStatus = isActive ? 'PAUSED' : 'ACTIVE';
    setError('');

    try {
      const updatedProject = await updateProjectStatus(project.id, nextStatus);
      setProjects((currentProjects) => sortProjectsByDueDate(
        currentProjects.map((item) => (item.id === updatedProject.id ? updatedProject : item)),
      ));
      return updatedProject;
    } catch (requestError) {
      console.error(requestError);
      if (requestError instanceof ApiError) {
        setError(requestError.message || 'No pudimos cambiar el estado del proyecto.');
      } else {
        setError('No pudimos cambiar el estado del proyecto.');
      }
      return null;
    }
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    setSelectedProject(null);
    setEditingProject(project);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleModalStatusChange = async (project: Project): Promise<void> => {
    const updatedProject = await handleStatusChange(project);
    if (updatedProject) {
      setSelectedProject(updatedProject);
    }
  };

  return (
    <main className="projects-page">
      <section className="projects-header">
        <div>
          <p className="projects-kicker">Proyectos</p>
          <h1>Tu espacio de trabajo</h1>
          <p className="projects-intro">Entra en un proyecto para continuar con sus tareas.</p>
        </div>

        {isAdmin && (
          <button type="button" className="primary-button" onClick={openCreateForm}>
            Nuevo proyecto
          </button>
        )}
      </section>

      <form className="projects-search" onSubmit={(event) => event.preventDefault()} noValidate>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar proyectos"
          aria-label="Buscar proyectos"
        />
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}

      {isFormOpen && (
        <div className="project-form-modal-backdrop" role="presentation" onMouseDown={closeForm}>
          <div
            ref={projectFormModalRef}
            className="project-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-form-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="project-modal-close" onClick={closeForm} aria-label="Cerrar formulario">
              ×
            </button>
            <h2 id="project-form-title">{editingProject ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <ProjectForm
              key={editingProject ? editingProject.id : 'new-project'}
              initialValues={
                editingProject
                  ? {
                      name: editingProject.name,
                      description: editingProject.description ?? '',
                      priority: editingProject.priority,
                      startDate: editingProject.startDate?.slice(0, 10) ?? '',
                      dueDate: editingProject.dueDate?.slice(0, 10) ?? '',
                    }
                  : initialFormValues
              }
              submitLabel={editingProject ? 'Guardar cambios' : 'Crear proyecto'}
              onSubmit={editingProject ? handleEdit : handleCreate}
              onCancel={closeForm}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {loading ? (
        <p className="empty-state">Cargando proyectos...</p>
      ) : projects.length === 0 ? (
        <p className="empty-state">No hay proyectos para mostrar.</p>
      ) : (
        <ProjectList
          projects={projects}
          onOpen={setSelectedProject}
        />
      )}

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          canManage={isAdmin}
          onClose={() => setSelectedProject(null)}
          onEdit={openEditForm}
          onStatusChange={handleModalStatusChange}
        />
      )}
    </main>
  );
}
