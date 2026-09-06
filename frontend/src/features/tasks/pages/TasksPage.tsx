import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ApiError } from '../../../lib/api/client';
import { useAuth } from '../../auth/context/useAuth';
import { getUsers } from '../../users/api';
import { getProject } from '../../projects/api';
import { archiveTask, changeTaskStatus, createTask, getTasks, updateTask } from '../api';
import { TaskForm } from '../components/TaskForm';
import { TaskDetailModal } from '../components/TaskDetailModal';
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

function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((first, second) => {
    if (!first.dueDate) return 1;
    if (!second.dueDate) return -1;
    return first.dueDate.localeCompare(second.dueDate);
  });
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isStatusNoticeOpen, setIsStatusNoticeOpen] = useState(false);

  const loadTasks = useCallback(async (term: string): Promise<void> => {
    try {
      const nextTasks = await getTasks(term.trim(), projectId);
      setTasks(sortTasksByDueDate(nextTasks));
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
    const loadProjectAndUsers = async (): Promise<void> => {
      try {
        const [nextProject, nextUsers] = await Promise.all([
          projectId ? getProject(projectId) : Promise.resolve(null),
          isAdmin ? getUsers() : Promise.resolve([]),
        ]);
        setProject(nextProject);
        setUsers(nextUsers);
      } catch (requestError) {
        console.error(requestError);
        setError('No pudimos cargar este proyecto. Inténtalo de nuevo.');
      }
    };

    void loadProjectAndUsers();
  }, [isAdmin, projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      void loadTasks(search);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [loadTasks, search]);

  const handleCreate = async (values: TaskFormValues): Promise<void> => {
    if (!projectId) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createdTask = await createTask(projectId, values);
      if (!createdTask) {
        throw new Error('Task creation returned no task');
      }
      setTasks((currentTasks) => sortTasksByDueDate([createdTask, ...currentTasks]));
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
      setTasks((currentTasks) => sortTasksByDueDate(
        currentTasks.map((task) => task.id === updatedTask.id ? updatedTask : task),
      ));
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

  const handleChangeStatus = async (task: Task, status: TaskStatus): Promise<boolean> => {
    const canChangeStatus = isAdmin || task.assignee?.id === user?.id;
    if (!canChangeStatus) {
      return false;
    }

    setError('');
    try {
      const updatedTask = await changeTaskStatus(task.id, { status });
      if (!updatedTask) {
        throw new Error('Task status update returned no task');
      }
      setTasks((currentTasks) => sortTasksByDueDate(
        currentTasks.map((item) => item.id === updatedTask.id ? updatedTask : item),
      ));
      return true;
    } catch (requestError) {
      console.error(requestError);
      if (requestError instanceof ApiError && requestError.status === 403) {
        setIsStatusNoticeOpen(true);
        return false;
      }
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos actualizar el estado.');
      return false;
    }
  };

  const handleModalEdit = (task: Task): void => {
    setSelectedTask(null);
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleModalArchive = async (task: Task): Promise<void> => {
    await handleArchive(task);
    setSelectedTask(null);
  };

  const handleModalStatus = async (task: Task, status: TaskStatus): Promise<void> => {
    const updated = await handleChangeStatus(task, status);
    if (updated) {
      setSelectedTask((currentTask) => currentTask ? { ...currentTask, status } : null);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    setError('');
  };

  return (
    <main className="app-page tasks-page">
      {projectId && <Link className="back-link" to="/projects">← Volver a proyectos</Link>}

      <section className="tasks-header">
        <div>
          <p className="tasks-kicker">Tareas</p>
          <h1>{project?.name ?? 'Tus pendientes'}</h1>
          <p className="tasks-intro">
            Organiza el trabajo, sigue el progreso y mantén todo en marcha.
          </p>
          {project?.description && (
            <p className="tasks-project-description">{project.description}</p>
          )}
        </div>
      </section>

      <form className="tasks-search" onSubmit={(event) => event.preventDefault()} noValidate>
        <label className="search-field">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar tareas"
            aria-label="Buscar tareas"
          />
        </label>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}

      {isFormOpen && projectId && (
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
          canCreate={Boolean(projectId)}
          onCreate={() => { setEditingTask(null); setIsFormOpen(true); }}
          onOpen={setSelectedTask}
          onChangeStatus={handleChangeStatus}
          onStatusDenied={() => setIsStatusNoticeOpen(true)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUserId={user?.id ?? ''}
          isAdmin={isAdmin}
          onClose={() => setSelectedTask(null)}
          onEdit={handleModalEdit}
          onArchive={handleModalArchive}
          onChangeStatus={handleModalStatus}
          onStatusDenied={() => setIsStatusNoticeOpen(true)}
        />
      )}

      {isStatusNoticeOpen && (
        <div className="task-status-notice-backdrop" role="presentation" onMouseDown={() => setIsStatusNoticeOpen(false)}>
          <div
            className="task-status-notice"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="task-status-notice-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="task-status-notice-mark" aria-hidden="true">!</span>
            <h2 id="task-status-notice-title">Acción no permitida</h2>
            <p>Solo un administrador puede completar o reabrir esta tarea.</p>
            <button type="button" className="primary-button" onClick={() => setIsStatusNoticeOpen(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
