export type SortOption = '' | 'dueDate' | 'priority' | 'createdAt';

type SortControlProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  label?: string;
};

export function SortControl({ value, onChange, label = 'Ordenar por' }: SortControlProps) {
  return (
    <label className="sort-control">
      <span className="sort-control-icon" aria-hidden="true">↕</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        <option value="">{label}</option>
        <option value="dueDate">Entrega más próxima</option>
        <option value="priority">Prioridad más alta</option>
        <option value="createdAt">Más recientes</option>
      </select>
    </label>
  );
}
