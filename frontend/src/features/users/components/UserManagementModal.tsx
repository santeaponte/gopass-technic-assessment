import { useEffect, useState } from 'react';

import { ApiError } from '../../../lib/api/client';
import type { PublicUser } from '../../auth/types';
import { createUser, getUsers, updateUserStatus } from '../api';
import type { CreateUserValues } from '../schemas';
import { UserForm } from './UserForm';

type UserManagementModalProps = {
  currentUserId: string;
  onClose: () => void;
};

const roleLabels: Record<PublicUser['role'], string> = {
  ADMIN: 'Administrador',
  VIEWER: 'Usuario',
};

export function UserManagementModal({ currentUserId, onClose }: UserManagementModalProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getUsers()
      .then((loadedUsers) => {
        if (!isMounted) {
          return;
        }
        setUsers(loadedUsers);
        setError('');
      })
      .catch((requestError: unknown) => {
        if (!isMounted) {
          return;
        }
        console.error(requestError);
        setError(requestError instanceof ApiError ? requestError.message : 'No pudimos cargar los usuarios.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (values: CreateUserValues): Promise<void> => {
    setIsSubmitting(true);
    setError('');
    try {
      const createdUser = await createUser(values);
      setUsers((currentUsers) => [...currentUsers, createdUser]);
      setIsCreating(false);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos crear el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (user: PublicUser): Promise<void> => {
    setIsSubmitting(true);
    setError('');
    try {
      const updatedUser = await updateUserStatus(user.id, !user.isActive);
      setUsers((currentUsers) => currentUsers.map((item) => item.id === updatedUser.id ? updatedUser : item));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos actualizar el estado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="user-management-modal" role="dialog" aria-modal="true" aria-labelledby="user-management-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="user-modal-close" aria-label="Cerrar gestión de usuarios" onClick={onClose}>×</button>
        <div className="user-management-header">
          <div>
            <p className="projects-kicker">Administración</p>
            <h2 id="user-management-title">Usuarios</h2>
          </div>
          <button type="button" className="primary-button" onClick={() => setIsCreating((open) => !open)}>
            {isCreating ? 'Ver usuarios' : 'Crear usuario'}
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {isCreating ? (
          <UserForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} isSubmitting={isSubmitting} />
        ) : isLoading ? (
          <p className="empty-state">Cargando usuarios...</p>
        ) : (
          <ul className="user-management-list">
            {users.map((user) => (
              <li key={user.id} className={`user-management-item${user.isActive ? '' : ' user-management-item-inactive'}`}>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <span className="user-meta-secondary">
                    <span className={`user-role user-role-${user.role.toLowerCase()}`}>
                      {roleLabels[user.role]}
                    </span>
                    <small>{user.isActive ? 'Activo' : 'Inactivo'}</small>
                  </span>
                </div>
                <button
                  type="button"
                  className={user.isActive ? 'secondary-button' : 'primary-button'}
                  disabled={user.id === currentUserId || isSubmitting}
                  onClick={() => void handleStatusChange(user)}
                >
                  {user.id === currentUserId ? 'Tu usuario' : user.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
