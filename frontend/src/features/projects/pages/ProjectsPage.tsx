import { useCallback, useEffect, useState, type FormEvent, useRef } from 'react';

import { useAuth } from '../../auth/context/useAuth';
import { ApiError } from '../../../lib/api/client';
import { createProject, deleteProject, getProjects, updateProject } from '../api';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectList } from '../components/ProjectList';
import type { Project, ProjectFormValues } from '../types';

const initialFormValues: ProjectFormValues = {
  name: '',
  description: '',
  startDate: '',
  dueDate: '',
};

export function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const projectFormModalRef = useRef<HTMLDivElement>(null);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
    setError('');
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
      setProjects(nextProjects);
    } catch (requestError) {
      console.error(requestError);
      setError('No pudimos cargar los proyectos. Inténtalo de nuevo.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialProjects = async (): Promise<void> => {
      try {
        const nextProjects = await getProjects('');
        setError('');
        setProjects(nextProjects);
      } catch (requestError) {
        console.error(requestError);
        setError('No pudimos cargar los proyectos. Inténtalo de nuevo.');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    void loadInitialProjects();
  }, []);

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    await loadProjects(search);
  };

  const handleCreate = async (values: ProjectFormValues): Promise<void> => {
    if (!isAdmin) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createdProject = await createProject(values);
      setProjects((currentProjects) => [createdProject, ...currentProjects]);
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (requestError) {
      console.error(requestError);
      if (requestError instanceof ApiError) {
        setError(requestError.message || 'No pudimos crear el proyecto.');
      } else {
        setError('No pudimos crear el proyecto.');
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
    setError('');

    try {
      const updatedProject = await updateProject(editingProject.id, values);
      setProjects((currentProjects) =>
        currentProjects.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
      );
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (requestError) {
      console.error(requestError);
      if (requestError instanceof ApiError) {
        setError(requestError.message || 'No pudimos editar el proyecto.');
      } else {
        setError('No pudimos editar el proyecto.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (project: Project): Promise<boolean> => {
    if (!isAdmin) {
      return false;
    }

    const confirmed = window.confirm(`¿Eliminar el proyecto "${project.name}"?`);
    if (!confirmed) {
      return false;
    }

    setError('');

    try {
      await deleteProject(project.id);
      setProjects((currentProjects) => currentProjects.filter((item) => item.id !== project.id));
      return true;
    } catch (requestError) {
      console.error(requestError);
      if (requestError instanceof ApiError) {
        setError(requestError.message || 'No pudimos eliminar el proyecto.');
      } else {
        setError('No pudimos eliminar el proyecto.');
      }
      return false;
    }
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    setSelectedProject(null);
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleModalDelete = async (project: Project): Promise<void> => {
    const deleted = await handleDelete(project);
    if (deleted) {
      setSelectedProject(null);
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

      <form className="projects-search" onSubmit={handleSearchSubmit} noValidate>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar proyectos"
          aria-label="Buscar proyectos"
        />
        <button type="submit" className="secondary-button">
          Buscar
        </button>
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
            <ProjectForm
              key={editingProject ? editingProject.id : 'new-project'}
              initialValues={
                editingProject
                  ? {
                      name: editingProject.name,
                      description: editingProject.description ?? '',
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
          onDelete={handleModalDelete}
        />
      )}
    </main>
  );
}
