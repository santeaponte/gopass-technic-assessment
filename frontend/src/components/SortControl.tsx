export type SortOption = '' | 'dueDate' | 'priority' | 'createdAt' | 'project' | 'calendar';

const sortOptions: SortOption[] = ['', 'dueDate', 'priority', 'createdAt', 'project', 'calendar'];

function isSortOption(value: string): value is SortOption {
  return sortOptions.includes(value as SortOption);
}

type SortControlProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  label?: string;
  showCalendar?: boolean;
};

export function SortControl({ value, onChange, label = 'Ordenar por', showCalendar = false }: SortControlProps) {
  return (
    <label className="sort-control">
      <span className="sort-control-icon" aria-hidden="true">↕</span>
      <select
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (isSortOption(nextValue)) {
            onChange(nextValue);
          }
        }}
        aria-label={label}
      >
        <option value="">{label}</option>
        <option value="dueDate">Entrega más próxima</option>
        <option value="priority">Prioridad más alta</option>
        <option value="createdAt">Más recientes</option>
        <option value="project">Proyecto</option>
        {showCalendar && <option value="calendar">Calendario</option>}
      </select>
    </label>
  );
}
