import { createContext } from 'react';

import type { PublicUser } from '../types';

export type AuthContextValue = {
  user: PublicUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: PublicUser, token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
