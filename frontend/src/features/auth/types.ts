export type UserRole = 'ADMIN' | 'VIEWER';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type LoginResponse = {
  user: PublicUser;
  token: string;
};
