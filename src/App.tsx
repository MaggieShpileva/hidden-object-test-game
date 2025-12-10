import type { FC } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Error } from './pages/Error';
import { Scroll } from './pages/Scroll';
import { Feed } from './pages/Feed';
import { Game, GamePixi, Game3D, Layout } from './components/Feature';

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
        path: '/game',
        element: <Game />,
      },
      {
        path: '/game-pixi',
        element: <GamePixi />,
      },
      {
        path: '/game-3d',
        element: <Game3D />,
      },
      {
        path: '/bird',
        element: <Scroll />,
      },
      {
        path: '/feed',
        element: <Feed />,
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
