import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProjectsPage } from '../features/projects/pages/ProjectsPage';
import { TasksPage } from '../features/tasks/pages/TasksPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        element: <PublicRoute />,
        children: [{ path: 'login', element: <LoginPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Navigate to="/projects" replace /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:projectId/tasks', element: <TasksPage /> },
        ],
      },
    ],
  },
]);
