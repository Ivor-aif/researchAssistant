import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import OptimizedMainLayout from '../components/layout/OptimizedMainLayout';

// 使用懒加载优化页面加载性能
const Auth = lazy(() => import('../pages/Auth'));
const PaperSearch = lazy(() => import('../pages/PaperSearch'));
const InnovationAnalysis = lazy(() => import('../pages/InnovationAnalysis'));
const ResearchProgress = lazy(() => import('../pages/ResearchProgress'));
const PaperReproduction = lazy(() => import('../pages/PaperReproduction'));
const Report = lazy(() => import('../pages/Report'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <OptimizedMainLayout />,
    children: [
      {
        path: 'auth',
        element: <Auth />
      },
      {
        path: 'paper-search',
        element: <PaperSearch />
      },
      {
        path: 'innovation-analysis',
        element: <InnovationAnalysis />
      },
      {
        path: 'research-progress',
        element: <ResearchProgress />
      },
      {
        path: 'paper-reproduction',
        element: <PaperReproduction />
      },
      {
        path: 'report',
        element: <Report />
      }
    ]
  }
]);

export default router;