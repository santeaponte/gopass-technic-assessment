export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
  createdAt: string;
};

export type TaskStatusChange = {
  id: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  comment: string | null;
  createdAt: string;
  changedByUser: TaskUser;
};

export type TaskNote = {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
};

export type TaskProject = {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  owner: TaskUser;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  project: TaskProject;
  creator: TaskUser;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  assignee: TaskUser | null;
  statusHistory: TaskStatusChange[];
};

export type TaskFormValues = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
};

export type ChangeTaskStatusValues = {
  status: TaskStatus;
  comment?: string;
};
