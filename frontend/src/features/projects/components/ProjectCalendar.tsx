import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Task } from '../../tasks/types';
import { formatDate } from '../../../lib/date';
import type { Project } from '../types';

type CalendarEvent = {
  id: string;
  date: string;
  label: string;
  detail: string;
  kind: 'project' | 'task';
  projectId: string;
  taskId?: string;
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

export function ProjectCalendar({ projects, tasks, onOpenProject }: ProjectCalendarProps) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const days = useMemo(() => getMonthDays(month), [month]);
  const events = useMemo<CalendarEvent[]>(() => [
    ...projects.flatMap((project) => [
      ...(project.startDate ? [{ id: `${project.id}-start`, date: project.startDate.slice(0, 10), label: project.name, detail: 'Inicio del proyecto', kind: 'project' as const, projectId: project.id }] : []),
      ...(project.dueDate ? [{ id: `${project.id}-due`, date: project.dueDate.slice(0, 10), label: project.name, detail: 'Entrega del proyecto', kind: 'project' as const, projectId: project.id }] : []),
    ]),
    ...tasks.flatMap((task) => task.dueDate ? [{
      id: task.id,
      date: task.dueDate.slice(0, 10),
      label: task.title,
      detail: `Tarea · ${task.project.name}`,
      kind: 'task' as const,
      projectId: task.projectId,
      taskId: task.id,
    }] : []),
  ], [projects, tasks]);
  const eventsByDate = useMemo(() => events.reduce<Record<string, CalendarEvent[]>>((grouped, event) => {
    grouped[event.date] = [...(grouped[event.date] ?? []), event];
    return grouped;
  }, {}), [events]);
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  return (
    <section className="project-calendar" aria-label="Calendario de proyectos y tareas">
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
              {dayEvents.length > 0 && <span className="project-calendar-dots" aria-label={`${dayEvents.length} eventos`}>{dayEvents.slice(0, 3).map((event) => <i key={event.id} className={`project-calendar-dot project-calendar-dot-${event.kind}`} />)}</span>}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="project-calendar-popup-backdrop" role="presentation" onMouseDown={() => setSelectedDate(null)}>
          <section className="project-calendar-popup" role="dialog" aria-modal="true" aria-labelledby="calendar-events-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="project-modal-close" onClick={() => setSelectedDate(null)} aria-label="Cerrar eventos">×</button>
            <p className="projects-kicker">Agenda</p>
            <h2 id="calendar-events-title">{formatDate(selectedDate)}</h2>
            {selectedEvents.length === 0 ? <p className="empty-state">No hay eventos para este día.</p> : (
              <ul className="project-calendar-events">
                {selectedEvents.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      className="project-calendar-event"
                      onClick={() => {
                        setSelectedDate(null);
                        if (event.kind === 'project') {
                          onOpenProject(event.projectId);
                          return;
                        }
                        if (!event.taskId) {
                          return;
                        }
                        navigate(`/projects/${encodeURIComponent(event.projectId)}/tasks?taskId=${encodeURIComponent(event.taskId)}`);
                      }}
                    >
                      <span className={`project-calendar-event-mark project-calendar-event-mark-${event.kind}`} />
                      <span>
                        <strong>{event.label}</strong>
                        <small>{event.detail}</small>
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
