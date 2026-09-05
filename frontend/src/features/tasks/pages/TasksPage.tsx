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
      setTasks((currentTasks) => sortTasksByDueDate(
        currentTasks.map((item) => item.id === updatedTask.id ? updatedTask : item),
      ));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos actualizar el estado.');
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
    await handleChangeStatus(task, status);
    setSelectedTask((currentTask) => currentTask ? { ...currentTask, status } : null);
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

      <form className="tasks-search" onSubmit={(event) => event.preventDefault()} noValidate>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar tareas"
          aria-label="Buscar tareas"
        />
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
          canCreate={isAdmin && Boolean(projectId)}
          onCreate={() => { setEditingTask(null); setIsFormOpen(true); }}
          onOpen={setSelectedTask}
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
        />
      )}
    </main>
  );
}
