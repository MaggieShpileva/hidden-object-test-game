import type { FC } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Error } from './pages/Error';
import { Layout } from './components/Feature';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Home />,
      },

      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export const App: FC = () => {
  return <RouterProvider router={router} />;
};
