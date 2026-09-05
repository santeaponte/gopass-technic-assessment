import { useState, type FormEvent } from 'react';

import { ApiError } from '../../../lib/api/client';
import { loginSchema, type LoginFormValues } from '../schemas';
import { login } from '../api';

const initialValues: LoginFormValues = {
  email: '',
  password: '',
};

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

export function LoginPage() {
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof LoginFormValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setRequestError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError('');
    setSuccessMessage('');

    const parsedValues = loginSchema.safeParse(values);
    if (!parsedValues.success) {
      const nextFieldErrors: FieldErrors = {};
      parsedValues.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') {
          nextFieldErrors[field] = issue.message;
        }
      });
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await login(parsedValues.data);
      setSuccessMessage(`Bienvenido, ${response.user.name}. Tu sesión está lista.`);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setRequestError('El email o la contraseña no son correctos.');
        } else if (error.status === 422) {
          setRequestError('Revisa los datos ingresados.');
        } else {
          setRequestError('No pudimos iniciar sesión. Inténtalo nuevamente.');
        }
      } else {
        setRequestError('No pudimos conectar con el servidor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="login-title">
        <p className="login-kicker">Gopass workspace</p>
        <h1 className="login-title" id="login-title">
          Vuelve al trabajo importante.
        </h1>
        <p className="login-copy">
          Gestiona proyectos y tareas con una vista clara de lo que sigue.
        </p>
      </section>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            aria-invalid={fieldErrors.email ? 'true' : undefined}
          />
          {fieldErrors.email && (
            <p className="login-error" id="email-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="login-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => handleChange('password', event.target.value)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            aria-invalid={fieldErrors.password ? 'true' : undefined}
          />
          {fieldErrors.password && (
            <p className="login-error" id="password-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {requestError && <p className="login-error" role="alert">{requestError}</p>}
        {successMessage && <p className="login-success" role="status">{successMessage}</p>}

        <button className="login-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
