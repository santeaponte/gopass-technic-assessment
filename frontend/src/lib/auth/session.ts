import type { PublicUser } from '../../features/auth/types';

const AUTH_STORAGE_KEY = 'gopass_auth';

export type AuthSession = {
  user: PublicUser;
  token: string;
};

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return typeof session.token === 'string' && typeof session.user === 'object' && session.user !== null;
}

export function getStoredSession(): AuthSession | null {
  try {
    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    const parsedSession: unknown = JSON.parse(rawSession);
    if (!isAuthSession(parsedSession)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsedSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
