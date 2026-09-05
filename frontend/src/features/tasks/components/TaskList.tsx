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

const nextStatuses: Record<TaskStatus, TaskStatus | null> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'IN_REVIEW',
  IN_REVIEW: 'DONE',
  DONE: null,
};

type TaskListProps = {
  tasks: Task[];
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
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

export function TaskList({ tasks, currentUserId, isAdmin, onEdit, onArchive, onChangeStatus }: TaskListProps) {
  return (
    <div className="task-list">
      {tasks.map((task) => {
        const canChangeStatus = isAdmin || task.assignee?.id === currentUserId;
        const nextStatus = nextStatuses[task.status];
        const dueDate = formatDate(task.dueDate);

        return (
          <article key={task.id} className="task-item">
            <div className="task-main">
              <div className="task-heading">
                <div>
                  <span className={`task-priority task-priority-${task.priority.toLowerCase()}`}>
                    Prioridad {priorityLabels[task.priority]}
                  </span>
                  <h2>{task.title}</h2>
                </div>
                <span className={`task-status task-status-${task.status.toLowerCase()}`}>
                  {statusLabels[task.status]}
                </span>
              </div>

              <p className="task-description">{task.description || 'Sin descripción.'}</p>

              <div className="task-meta">
                <span>Responsable: {task.assignee?.name || 'Sin asignar'}</span>
                {dueDate && <span>Entrega: {dueDate}</span>}
              </div>
            </div>

            <div className="task-actions">
              {canChangeStatus && nextStatus && (
                <button type="button" className="secondary-button" onClick={() => onChangeStatus(task, nextStatus)}>
                  Pasar a {statusLabels[nextStatus]}
                </button>
              )}
              {isAdmin && (
                <>
                  <button type="button" className="secondary-button" onClick={() => onEdit(task)}>Editar</button>
                  <button type="button" className="danger-button" onClick={() => onArchive(task)}>Archivar</button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
