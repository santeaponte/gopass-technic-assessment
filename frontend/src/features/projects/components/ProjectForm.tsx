import { useState, type FormEvent } from 'react';

import { projectFormSchema, type ProjectFormValues } from '../schemas';

type ProjectFormProps = {
  initialValues?: ProjectFormValues;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

type FieldErrors = Partial<Record<keyof ProjectFormValues, string>>;

const emptyValues: ProjectFormValues = {
  name: '',
  description: '',
  priority: 'MEDIUM',
  startDate: '',
  dueDate: '',
};

export function ProjectForm({
  initialValues = emptyValues,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (field: keyof ProjectFormValues, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedValues = projectFormSchema.safeParse(values);

    if (!parsedValues.success) {
      const nextErrors: FieldErrors = {};

      parsedValues.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (field === 'name' || field === 'description' || field === 'priority' || field === 'startDate' || field === 'dueDate') {
          nextErrors[field] = issue.message;
        }
      });

      setFieldErrors(nextErrors);
      return;
    }

    onSubmit({
      name: parsedValues.data.name,
      description: parsedValues.data.description ?? '',
      priority: parsedValues.data.priority,
      startDate: parsedValues.data.startDate,
      dueDate: parsedValues.data.dueDate,
    });
  };

  return (
    <form className="project-form" onSubmit={handleSubmit} noValidate>
      <div className="project-form-field">
        <label htmlFor="project-name">Nombre</label>
        <input
          id="project-name"
          name="project-name"
          type="text"
          value={values.name}
          onChange={(event) => handleChange('name', event.target.value)}
          placeholder="Ej. Rediseño de onboarding"
          aria-invalid={fieldErrors.name ? 'true' : undefined}
        />
        {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
      </div>

      <div className="project-form-field">
        <label htmlFor="project-description">Descripción</label>
        <textarea
          id="project-description"
          name="project-description"
          value={values.description}
          onChange={(event) => handleChange('description', event.target.value)}
          placeholder="Describe el objetivo del proyecto"
          rows={5}
        />
        {fieldErrors.description && <p className="field-error">{fieldErrors.description}</p>}
      </div>

      <div className="project-form-field">
        <span className="project-form-label">Prioridad</span>
        <div className="project-priority-options" role="group" aria-label="Prioridad del proyecto">
          <button
            type="button"
            className={`project-priority-choice project-priority-choice-low${values.priority === 'LOW' ? ' project-priority-choice-selected' : ''}`}
            aria-pressed={values.priority === 'LOW'}
            onClick={() => handleChange('priority', 'LOW')}
          >
            Baja
          </button>
          <button
            type="button"
            className={`project-priority-choice project-priority-choice-medium${values.priority === 'MEDIUM' ? ' project-priority-choice-selected' : ''}`}
            aria-pressed={values.priority === 'MEDIUM'}
            onClick={() => handleChange('priority', 'MEDIUM')}
          >
            Media
          </button>
          <button
            type="button"
            className={`project-priority-choice project-priority-choice-high${values.priority === 'HIGH' ? ' project-priority-choice-selected' : ''}`}
            aria-pressed={values.priority === 'HIGH'}
            onClick={() => handleChange('priority', 'HIGH')}
          >
            Alta
          </button>
        </div>
        {fieldErrors.priority && <p className="field-error">{fieldErrors.priority}</p>}
      </div>

      <div className="project-form-field">
        <label htmlFor="project-start-date">Fecha de inicio</label>
        <input
          id="project-start-date"
          name="project-start-date"
          type="date"
          value={values.startDate}
          onChange={(event) => handleChange('startDate', event.target.value)}
          aria-invalid={fieldErrors.startDate ? 'true' : undefined}
        />
        {fieldErrors.startDate && <p className="field-error">{fieldErrors.startDate}</p>}
      </div>

      <div className="project-form-field">
        <label htmlFor="project-due-date">Fecha de entrega</label>
        <input
          id="project-due-date"
          name="project-due-date"
          type="date"
          value={values.dueDate}
          min={values.startDate || undefined}
          onChange={(event) => handleChange('dueDate', event.target.value)}
          aria-invalid={fieldErrors.dueDate ? 'true' : undefined}
        />
        {fieldErrors.dueDate && <p className="field-error">{fieldErrors.dueDate}</p>}
      </div>

      <div className="project-form-actions">
        {onCancel && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
