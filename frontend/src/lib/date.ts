const localTimeZone = 'America/Bogota';

export function getTodayCalendarDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: localTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getProjectDisplayStatus(
  status: 'ACTIVE' | 'PAUSED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED',
  dueDate: string | null | undefined,
  taskStatuses?: Array<'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'>,
): { label: string; className: string } {
  if (status === 'COMPLETED' || (taskStatuses && taskStatuses.length > 0 && taskStatuses.every((taskStatus) => taskStatus === 'DONE'))) {
    return { label: 'Completado', className: 'completed' };
  }

  if (dueDate) {
    const today = getTodayCalendarDate();
    const daysUntilDue = Math.round(
      (Date.parse(`${dueDate.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
    );

    if (daysUntilDue < 0) {
      return { label: 'Vencido', className: 'overdue' };
    }

    if (daysUntilDue <= 5) {
      return { label: 'Próximo a vencer', className: 'due-soon' };
    }
  }

  const labels = {
    ACTIVE: { label: 'Activo', className: 'active' },
    PAUSED: { label: 'Inactivo', className: 'paused' },
    IN_REVIEW: { label: 'En revisión', className: 'in-review' },
    COMPLETED: { label: 'Completado', className: 'completed' },
    CANCELLED: { label: 'Cancelado', className: 'cancelled' },
  } as const;

  return labels[status];
}

export function formatDate(value: string | null | undefined, shortMonth = false): string {
  if (!value) {
    return 'Sin fecha';
  }

  if (value.includes('T')) {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: localTimeZone,
      day: '2-digit',
      month: shortMonth ? 'short' : '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }

  const [year, month, day] = value.slice(0, 10).split('-');
  if (shortMonth) {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  return `${day}/${month}/${year}`;
}
