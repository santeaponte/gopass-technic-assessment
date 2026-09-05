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

        if (field === 'name' || field === 'description') {
          nextErrors[field] = issue.message;
        }
      });

      setFieldErrors(nextErrors);
      return;
    }

    onSubmit({
      name: parsedValues.data.name,
      description: parsedValues.data.description ?? '',
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
