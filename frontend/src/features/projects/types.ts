export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH';

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
  priority: ProjectPriority;
  createdAt: string;
  updatedAt: string;
  startDate: string | null;
  dueDate: string | null;
  owner: ProjectOwner;
};

export type ProjectFormValues = {
  name: string;
  description: string;
  priority: ProjectPriority;
  startDate: string;
  dueDate: string;
};
