import { useMemo, useState, type ReactNode } from 'react';

import {
  clearSession,
  getStoredSession,
  saveSession,
  type AuthSession,
} from '../../../lib/auth/session';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: session !== null,
    login: (user, token) => {
      const nextSession = { user, token };
      saveSession(nextSession);
      setSession(nextSession);
    },
    logout: () => {
      clearSession();
      setSession(null);
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
