import { createBrowserRouter } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
  },
]);
