const localTimeZone = 'America/Bogota';

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
