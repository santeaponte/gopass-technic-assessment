import type { DragEvent } from 'react';
import type { Task, TaskStatus } from '../types';
import { formatDate } from '../../../lib/date';

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
  currentUserId: string;
  isAdmin: boolean;
  canCreate: boolean;
  onCreate: () => void;
  onOpen: (task: Task) => void;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
  onStatusDenied: () => void;
};

export function TaskList({ tasks, currentUserId, isAdmin, canCreate, onCreate, onOpen, onChangeStatus, onStatusDenied }: TaskListProps) {
  const statuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  return (
    <div className="task-board">
      {statuses.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        const handleDrop = (event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          const taskId = event.dataTransfer.getData('text/task-id');
          const task = tasks.find((item) => item.id === taskId);

          if (!task || task.status === status || (!isAdmin && task.creator.id !== currentUserId && task.assignee?.id !== currentUserId)) {
            return;
          }

          if (status === 'DONE' && !isAdmin) {
            onStatusDenied();
            return;
          }

          onChangeStatus(task, status);
        };

        return (
          <section
            key={status}
            className={`task-column task-column-${status.toLowerCase()}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <header className="task-column-header">
              <h2>{statusLabels[status]}</h2>
              <span className="task-column-count">{columnTasks.length}</span>
            </header>

            <div className="task-column-body">
              {columnTasks.map((task) => {
                const dueDate = task.dueDate ? formatDate(task.dueDate, true) : null;

                return (
                  <button
                    key={task.id}
                    type="button"
                    className="task-item"
                    draggable={isAdmin || task.creator.id === currentUserId || task.assignee?.id === currentUserId}
                    onDragStart={(event) => event.dataTransfer.setData('text/task-id', task.id)}
                    onClick={() => onOpen(task)}
                  >
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
