import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

import App from './App';
import AdminPage from '../routes/AdminPage';
import FinderPage from '../routes/FinderPage';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <FinderPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
