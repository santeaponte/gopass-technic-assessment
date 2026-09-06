import { useState, type FormEvent } from 'react';

import { taskFormSchema, type TaskFormValues } from '../schemas';
import type { PublicUser } from '../../auth/types';
import type { Project } from '../../projects/types';

const emptyValues: TaskFormValues = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
  assigneeId: '',
};

type TaskFormProps = {
  initialValues?: TaskFormValues;
  users: PublicUser[];
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  projects?: Project[];
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
};

type FieldErrors = Partial<Record<keyof TaskFormValues, string>>;

export function TaskForm({
  initialValues = emptyValues,
  users,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting,
  projects = [],
  selectedProjectId = '',
  onProjectChange,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (field: keyof TaskFormValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedValues = taskFormSchema.safeParse(values);

    if (!parsedValues.success) {
      const nextErrors: FieldErrors = {};
      parsedValues.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'title' || field === 'description' || field === 'priority' || field === 'dueDate' || field === 'assigneeId') {
          nextErrors[field] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      return;
    }

    onSubmit(parsedValues.data);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      {onProjectChange && (
        <div className="task-form-field task-form-field-wide">
          <label htmlFor="task-project">Proyecto</label>
          <select id="task-project" value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)} required>
            <option value="">Selecciona un proyecto</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
      )}
      <div className="task-form-field task-form-field-wide">
        <label htmlFor="task-title">Título</label>
        <input
          id="task-title"
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          aria-invalid={fieldErrors.title ? 'true' : undefined}
        />
        {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}
      </div>

      <div className="task-form-field task-form-field-wide">
        <label htmlFor="task-description">Descripción</label>
        <textarea
          id="task-description"
          rows={4}
          value={values.description}
          onChange={(event) => handleChange('description', event.target.value)}
          aria-invalid={fieldErrors.description ? 'true' : undefined}
        />
        {fieldErrors.description && <p className="field-error">{fieldErrors.description}</p>}
      </div>

      <div className="task-form-field">
        <label htmlFor="task-priority">Prioridad</label>
        <select id="task-priority" value={values.priority} onChange={(event) => handleChange('priority', event.target.value)}>
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
        </select>
      </div>

      <div className="task-form-field">
        <label htmlFor="task-due-date">Fecha límite</label>
        <input id="task-due-date" type="date" value={values.dueDate} onChange={(event) => handleChange('dueDate', event.target.value)} />
      </div>

      <div className="task-form-field task-form-field-wide">
        <label htmlFor="task-assignee">Responsable</label>
        <select id="task-assignee" value={values.assigneeId} onChange={(event) => handleChange('assigneeId', event.target.value)}>
          <option value="">Sin asignar</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
      </div>

      <div className="task-form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
