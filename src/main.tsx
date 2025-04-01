import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import App from './App';
import Layout from './layouts/dashboard';
import DashboardPage from './pages';
import StocksPage from './pages/stocks';
import PortfolioPage from './pages/portfolio';
import SignInPage from './pages/signin';
import ScreenerPage from './pages/screener';

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          {
            path: '',
            Component: DashboardPage,
          },
          {
            path: 'stocks',
            Component: StocksPage,
          },
          {
            path: 'portfolio',
            Component: PortfolioPage,
          },
          {
            path: 'screener',
            Component: ScreenerPage,
          },
        ],
      },
      {
        path: '/sign-in',
        Component: SignInPage,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);