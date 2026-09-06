import { useCallback, useEffect, useState, useRef } from 'react';

import { useAuth } from '../../auth/context/useAuth';
import { ApiError } from '../../../lib/api/client';
import { createProject, getProjects, updateProject, updateProjectStatus } from '../api';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectList } from '../components/ProjectList';
import type { Project, ProjectFormValues } from '../types';
import { SortControl, type SortOption } from '../../../components/SortControl';

const initialFormValues: ProjectFormValues = {
  name: '',
  description: '',
  priority: 'MEDIUM',
  startDate: '',
  dueDate: '',
};

const priorityOrder: Record<Project['priority'], number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function sortProjects(projects: Project[], sortOption: SortOption): Project[] {
  return [...projects].sort((first, second) => {
    if (sortOption === 'priority') {
      return priorityOrder[first.priority] - priorityOrder[second.priority];
    }

    if (sortOption === 'createdAt') {
      return second.createdAt.localeCompare(first.createdAt);
    }

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
  const [sortOption, setSortOption] = useState<SortOption>('');
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
      setProjects(sortProjects(nextProjects, sortOption));
    } catch (requestError) {
      console.error(requestError);
      setError('No pudimos cargar los proyectos. Inténtalo de nuevo.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [sortOption]);

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
      setProjects((currentProjects) => sortProjects([createdProject, ...currentProjects], sortOption));
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
      setProjects((currentProjects) => sortProjects(
        currentProjects.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
        sortOption,
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
      setProjects((currentProjects) => sortProjects(
        currentProjects.map((item) => (item.id === updatedProject.id ? updatedProject : item)),
        sortOption,
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
    setEditingProject(project);
    setFormError('');
    setIsFormOpen(true);
    setSelectedProject(null);
  };

  const handleModalStatusChange = async (project: Project): Promise<void> => {
    const updatedProject = await handleStatusChange(project);
    if (updatedProject) {
      setSelectedProject(updatedProject);
    }
  };

  return (
    <main className="app-page projects-page">
      <section className="projects-header">
        <div>
          <p className="projects-kicker">Proyectos</p>
          <h1>Tu espacio</h1>
          <p className="projects-intro">Elige un proyecto y continúa con lo que sigue.</p>
        </div>

        <div className="page-header-actions">
          <SortControl value={sortOption} onChange={setSortOption} />
          {isAdmin && (
            <button type="button" className="primary-button" onClick={openCreateForm}>
              Nuevo proyecto
            </button>
          )}
        </div>
      </section>

      <form className="projects-search" onSubmit={(event) => event.preventDefault()} noValidate>
        <label className="search-field">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar proyectos"
            aria-label="Buscar proyectos"
          />
        </label>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}

      {isFormOpen && (
        <div
          className="project-form-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
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
          canCreateTask={Boolean(user)}
          currentUserId={user?.id ?? ''}
          onClose={() => setSelectedProject(null)}
          onEdit={openEditForm}
          onStatusChange={handleModalStatusChange}
        />
      )}
    </main>
  );
}
