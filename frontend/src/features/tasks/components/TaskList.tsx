import type { Task, TaskStatus } from '../types';

const statusLabels: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revisión',
  DONE: 'Completada',
};

const priorityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
} as const;

type TaskListProps = {
  tasks: Task[];
  canCreate: boolean;
  onCreate: () => void;
  onOpen: (task: Task) => void;
};

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

export function TaskList({ tasks, canCreate, onCreate, onOpen }: TaskListProps) {
  const statuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  return (
    <div className="task-board">
      {statuses.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <section key={status} className={`task-column task-column-${status.toLowerCase()}`}>
            <header className="task-column-header">
              <h2>{statusLabels[status]}</h2>
              <span className="task-column-count">{columnTasks.length}</span>
            </header>

            <div className="task-column-body">
              {columnTasks.map((task) => {
                const dueDate = formatDate(task.dueDate);

                return (
                  <button key={task.id} type="button" className="task-item" onClick={() => onOpen(task)}>
                    <div className="task-main">
                      <div className="task-heading">
                        <span className={`task-priority task-priority-${task.priority.toLowerCase()}`}>
                          Prioridad {priorityLabels[task.priority]}
                        </span>
                        <h3>{task.title}</h3>
                      </div>
                      <p className="task-due-date">Entrega: {dueDate || 'Sin fecha'}</p>
                    </div>
                  </button>
                );
              })}

              {status === 'PENDING' && canCreate && (
                <button type="button" className="task-create-button" onClick={onCreate}>
                  + Crear tarea
                </button>
              )}

              {columnTasks.length === 0 && !(status === 'PENDING' && canCreate) && (
                <p className="task-column-empty">Sin tareas</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
