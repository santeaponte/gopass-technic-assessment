import { useMemo, useState } from 'react';

import type { Task } from '../../tasks/types';
import { formatDate } from '../../../lib/date';
import type { Project } from '../types';

type CalendarEvent = {
  id: string;
  date: string;
  label: string;
  detail: string;
  footer: string;
  projectId: string;
};

type ProjectCalendarProps = {
  projects: Project[];
  tasks: Task[];
  onOpenProject: (projectId: string) => void;
};

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMonthDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function labelForStatus(status: Project['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'Activo';
    case 'PAUSED':
      return 'Pausado';
    case 'IN_REVIEW':
      return 'En revisión';
    case 'COMPLETED':
      return 'Completado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
}

function labelForPriority(priority: Project['priority']): string {
  switch (priority) {
    case 'HIGH':
      return 'Alta';
    case 'MEDIUM':
      return 'Media';
    case 'LOW':
      return 'Baja';
    default:
      return priority;
  }
}

export function ProjectCalendar({ projects, tasks, onOpenProject }: ProjectCalendarProps) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const days = useMemo(() => getMonthDays(month), [month]);
  const events = useMemo<CalendarEvent[]>(() =>
    projects
      .filter((project) => project.dueDate)
      .map((project) => {
        const openTasks = tasks.filter((task) => task.projectId === project.id && task.status !== 'DONE');
        const tasksSummary = openTasks.length === 0
          ? 'Sin tareas abiertas'
          : openTasks.length === 1
            ? '1 tarea abierta'
            : `${openTasks.length} tareas abiertas`;

        return {
          id: `${project.id}-due`,
          date: project.dueDate!.slice(0, 10),
          label: project.name,
          detail: `${labelForStatus(project.status)} · Prioridad ${labelForPriority(project.priority)}`,
          footer: tasksSummary,
          projectId: project.id,
        };
      }),
    [projects, tasks],
  );
  const eventsByDate = useMemo(() => events.reduce<Record<string, CalendarEvent[]>>((grouped, event) => {
    grouped[event.date] = [...(grouped[event.date] ?? []), event];
    return grouped;
  }, {}), [events]);
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  return (
    <section className="project-calendar" aria-label="Calendario de proyectos">
      <header className="project-calendar-header">
        <button type="button" className="secondary-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mes anterior">←</button>
        <h2>{new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(month)}</h2>
        <button type="button" className="secondary-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Mes siguiente">→</button>
      </header>
      <div className="project-calendar-grid project-calendar-weekdays">
        {weekDays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="project-calendar-grid project-calendar-days">
        {days.map((day) => {
          const key = dateKey(day);
          const dayEvents = eventsByDate[key] ?? [];
          const isCurrentMonth = day.getMonth() === month.getMonth();
          return (
            <button type="button" key={key} className={`project-calendar-day${isCurrentMonth ? '' : ' project-calendar-day-muted'}`} onClick={() => setSelectedDate(key)}>
              <span>{day.getDate()}</span>
              {dayEvents.length > 0 && (
                <span className="project-calendar-dots" aria-label={`${dayEvents.length} proyectos con entrega`}>
                  {dayEvents.slice(0, 3).map((event) => <i key={event.id} className="project-calendar-dot" />)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="project-calendar-popup-backdrop" role="presentation" onMouseDown={() => setSelectedDate(null)}>
          <section className="project-calendar-popup" role="dialog" aria-modal="true" aria-labelledby="calendar-events-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="project-modal-close" onClick={() => setSelectedDate(null)} aria-label="Cerrar eventos">×</button>
            <p className="projects-kicker">Entregas</p>
            <h2 id="calendar-events-title">{formatDate(selectedDate)}</h2>
            {selectedEvents.length === 0 ? <p className="empty-state">No hay entregas para este día.</p> : (
              <ul className="project-calendar-events">
                {selectedEvents.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      className="project-calendar-event"
                      onClick={() => {
                        setSelectedDate(null);
                        onOpenProject(event.projectId);
                      }}
                    >
                      <span className="project-calendar-event-mark" />
                      <span className="project-calendar-event-copy">
                        <strong>{event.label}</strong>
                        <small>{event.detail}</small>
                        <em>{event.footer}</em>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
