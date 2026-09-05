import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ApiError } from '../../../lib/api/client';
import { useAuth } from '../../auth/context/useAuth';
import { getUsers } from '../../users/api';
import { getProject } from '../../projects/api';
import { archiveTask, changeTaskStatus, createTask, getTasks, updateTask } from '../api';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import type { Task, TaskFormValues, TaskStatus } from '../types';
import type { Project } from '../../projects/types';
import type { PublicUser } from '../../auth/types';

const emptyTaskValues: TaskFormValues = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
  assigneeId: '',
};

function toFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task.assignee?.id ?? '',
  };
}

export function TasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async (term: string): Promise<void> => {
    try {
      const nextTasks = await getTasks(term.trim(), projectId);
      setTasks(nextTasks);
      setError('');
    } catch (requestError) {
      console.error(requestError);
      setTasks([]);
      setError('No pudimos cargar las tareas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      try {
        const nextProject = projectId ? await getProject(projectId) : null;
        const [nextTasks, nextUsers] = await Promise.all([
          getTasks('', projectId),
          isAdmin ? getUsers() : Promise.resolve([]),
        ]);
        setProject(nextProject);
        setTasks(nextTasks);
        setUsers(nextUsers);
        setError('');
      } catch (requestError) {
        console.error(requestError);
        setError('No pudimos cargar este proyecto. Inténtalo de nuevo.');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, [isAdmin, projectId]);

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    await loadTasks(search);
  };

  const handleCreate = async (values: TaskFormValues): Promise<void> => {
    if (!isAdmin) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (!projectId) {
        return;
      }

      const createdTask = await createTask(projectId, values);
      if (!createdTask) {
        throw new Error('Task creation returned no task');
      }
      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setIsFormOpen(false);
      setEditingTask(null);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos crear la tarea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (values: TaskFormValues): Promise<void> => {
    if (!editingTask || !isAdmin) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedTask = await updateTask(editingTask.id, editingTask.projectId, values);
      if (!updatedTask) {
        throw new Error('Task update returned no task');
      }
      setTasks((currentTasks) => currentTasks.map((task) => task.id === updatedTask.id ? updatedTask : task));
      setIsFormOpen(false);
      setEditingTask(null);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos editar la tarea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (task: Task): Promise<void> => {
    if (!isAdmin || !window.confirm(`¿Archivar la tarea "${task.title}"?`)) {
      return;
    }

    setError('');
    try {
      await archiveTask(task.id);
      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos archivar la tarea.');
    }
  };

  const handleChangeStatus = async (task: Task, status: TaskStatus): Promise<void> => {
    const canChangeStatus = isAdmin || task.assignee?.id === user?.id;
    if (!canChangeStatus) {
      return;
    }

    setError('');
    try {
      const updatedTask = await changeTaskStatus(task.id, { status });
      if (!updatedTask) {
        throw new Error('Task status update returned no task');
      }
      setTasks((currentTasks) => currentTasks.map((item) => item.id === updatedTask.id ? updatedTask : item));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos actualizar el estado.');
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    setError('');
  };

  return (
    <main className="tasks-page">
      {projectId && <Link className="back-link" to="/projects">← Volver a proyectos</Link>}

      <section className="tasks-header">
        <div>
          <p className="tasks-kicker">Proyecto</p>
          <h1>{project?.name ?? 'Tareas'}</h1>
          {project?.description && <p className="tasks-intro">{project.description}</p>}
        </div>
      </section>

      <form className="tasks-search" onSubmit={handleSearchSubmit} noValidate>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar tareas"
          aria-label="Buscar tareas"
        />
        <button type="submit" className="secondary-button">Buscar</button>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}

      {isFormOpen && isAdmin && (
        <section className="task-panel">
          <h2>{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <TaskForm
            key={editingTask ? editingTask.id : 'new-task'}
            initialValues={editingTask ? toFormValues(editingTask) : emptyTaskValues}
            users={users}
            submitLabel={editingTask ? 'Guardar cambios' : 'Crear tarea'}
            onSubmit={editingTask ? handleEdit : handleCreate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </section>
      )}

      {loading ? (
        <p className="empty-state">Cargando tareas...</p>
      ) : tasks.length === 0 ? (
        <p className="empty-state">No hay tareas para mostrar.</p>
      ) : (
        <TaskList
          tasks={tasks}
          currentUserId={user?.id ?? ''}
          isAdmin={isAdmin}
          canCreate={isAdmin && Boolean(projectId)}
          onCreate={() => { setEditingTask(null); setIsFormOpen(true); }}
          onEdit={(task) => { setEditingTask(task); setIsFormOpen(true); }}
          onArchive={handleArchive}
          onChangeStatus={handleChangeStatus}
        />
      )}
    </main>
  );
}
