import { useMemo, useState } from 'react';

import type { Task } from '../../tasks/types';
import { formatDate, getProjectDisplayStatus } from '../../../lib/date';
import type { Project } from '../types';

const MAX_VISIBLE_PROJECTS_PER_DAY = 2;

type CalendarEvent = {
  id: string;
  date: string;
  label: string;
  statusLabel: string;
  statusClassName: string;
  priorityLabel: string;
  priorityClassName: string;
  ownerLabel: string;
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
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const displayStatus = getProjectDisplayStatus(
          project.status,
          project.dueDate,
          projectTasks.map((task) => task.status),
        );

        return {
          id: `${project.id}-due`,
          date: project.dueDate!.slice(0, 10),
          label: project.name,
          statusLabel: displayStatus.label,
          statusClassName: displayStatus.className,
          priorityLabel: labelForPriority(project.priority),
          priorityClassName: project.priority.toLowerCase(),
          ownerLabel: project.owner.name,
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

  const renderProject = (event: CalendarEvent) => (
    <button
      type="button"
      key={event.id}
      className={`project-calendar-project project-status-${event.statusClassName}`}
      onClick={() => {
        setSelectedDate(null);
        onOpenProject(event.projectId);
      }}
    >
      <strong className="project-calendar-project-name">Proyecto: {event.label}</strong>
      <span className={`project-status project-status-${event.statusClassName}`}>
        {event.statusLabel}
      </span>
      <span className={`project-priority project-priority-${event.priorityClassName}`}>
        Prioridad {event.priorityLabel}
      </span>
      <span>Propietario: {event.ownerLabel}</span>
      <span>Entrega: {formatDate(event.date)}</span>
    </button>
  );

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
            <div key={key} className={`project-calendar-day${isCurrentMonth ? '' : ' project-calendar-day-muted'}`}>
              <span className="project-calendar-day-number">{day.getDate()}</span>
              {dayEvents.length > 0 && (
                <span className="project-calendar-day-events" aria-label={`${dayEvents.length} proyectos con entrega`}>
                  {dayEvents.slice(0, MAX_VISIBLE_PROJECTS_PER_DAY).map(renderProject)}
                  {dayEvents.length > MAX_VISIBLE_PROJECTS_PER_DAY && (
                    <button
                      type="button"
                      className="project-calendar-more"
                      onClick={() => setSelectedDate(key)}
                    >
                      +{dayEvents.length - MAX_VISIBLE_PROJECTS_PER_DAY} proyectos
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {selectedDate && (
        <div className="project-calendar-popup-backdrop" role="presentation" onMouseDown={() => setSelectedDate(null)}>
          <section
            className="project-calendar-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-projects-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="project-modal-close" onClick={() => setSelectedDate(null)} aria-label="Cerrar proyectos">
              ×
            </button>
            <p className="projects-kicker">Proyectos</p>
            <h2 id="calendar-projects-title">{formatDate(selectedDate)}</h2>
            <div className="project-calendar-popup-list">
              {selectedEvents.map(renderProject)}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
