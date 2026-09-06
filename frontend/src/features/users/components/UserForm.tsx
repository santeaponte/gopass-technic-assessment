import { useState, type FormEvent } from 'react';

import { createUserSchema, type CreateUserValues } from '../schemas';

type UserFormProps = {
  onSubmit: (values: CreateUserValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

type FieldErrors = Partial<Record<keyof CreateUserValues, string>>;

const initialValues: CreateUserValues = { name: '', email: '', password: '', role: 'VIEWER' };

export function UserForm({ onSubmit, onCancel, isSubmitting = false }: UserFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = createUserSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'name' || field === 'email' || field === 'password' || field === 'role') {
          nextErrors[field] = issue.message;
        }
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  };

  const handleChange = (field: 'name' | 'email' | 'password', value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleRoleChange = (role: CreateUserValues['role']) => {
    setValues((current) => ({ ...current, role }));
    setErrors((current) => ({ ...current, role: undefined }));
  };

  return (
    <form className="user-form" onSubmit={handleSubmit} noValidate>
      <div className="user-form-field">
        <label htmlFor="new-user-name">Nombre</label>
        <input id="new-user-name" type="text" value={values.name} onChange={(event) => handleChange('name', event.target.value)} autoComplete="name" />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>
      <div className="user-form-field">
        <label htmlFor="new-user-email">Email</label>
        <input id="new-user-email" type="email" value={values.email} onChange={(event) => handleChange('email', event.target.value)} autoComplete="email" />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </div>
      <div className="user-form-field">
        <label htmlFor="new-user-password">Contraseña temporal</label>
        <input id="new-user-password" type="password" value={values.password} onChange={(event) => handleChange('password', event.target.value)} autoComplete="new-password" />
        {errors.password && <p className="form-error">{errors.password}</p>}
      </div>
      <div className="user-form-field">
        <span className="user-form-label">Rol</span>
        <div className="user-role-options" role="group" aria-label="Rol del usuario">
          <button
            type="button"
            className={`user-role-choice user-role-choice-viewer${values.role === 'VIEWER' ? ' user-role-choice-selected' : ''}`}
            aria-pressed={values.role === 'VIEWER'}
            onClick={() => handleRoleChange('VIEWER')}
          >
            Usuario
          </button>
          <button
            type="button"
            className={`user-role-choice user-role-choice-admin${values.role === 'ADMIN' ? ' user-role-choice-selected' : ''}`}
            aria-pressed={values.role === 'ADMIN'}
            onClick={() => handleRoleChange('ADMIN')}
          >
            Administrador
          </button>
        </div>
        {errors.role && <p className="form-error">{errors.role}</p>}
      </div>
      <div className="user-form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear usuario'}</button>
      </div>
    </form>
  );
}
