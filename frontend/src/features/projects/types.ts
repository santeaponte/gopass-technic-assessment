export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';

export type ProjectOwner = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  owner: ProjectOwner;
};

export type ProjectFormValues = {
  name: string;
  description: string;
};
