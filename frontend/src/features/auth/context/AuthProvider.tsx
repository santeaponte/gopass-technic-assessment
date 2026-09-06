import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { registerUnauthorizedHandler } from '../../../lib/api/client';
import {
  clearSession,
  getStoredSession,
  saveSession,
  type AuthSession,
} from '../../../lib/auth/session';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  const login = useCallback((user: AuthSession['user'], token: string) => {
    const nextSession = { user, token };
    saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => registerUnauthorizedHandler(logout), [logout]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: session !== null,
    login,
    logout,
  }), [login, logout, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
