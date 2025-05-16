import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
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
        index: true,
        element: <Navigate to="/paper-search" replace />
      },
      {
        path: 'auth',
        element: <Suspense fallback={<div>加载中...</div>}><Auth /></Suspense>
      },
      {
        path: 'paper-search',
        element: <Suspense fallback={<div>加载中...</div>}><PaperSearch /></Suspense>
      },
      {
        path: 'innovation-analysis',
        element: <Suspense fallback={<div>加载中...</div>}><InnovationAnalysis /></Suspense>
      },
      {
        path: 'research-progress',
        element: <Suspense fallback={<div>加载中...</div>}><ResearchProgress /></Suspense>
      },
      {
        path: 'paper-reproduction',
        element: <Suspense fallback={<div>加载中...</div>}><PaperReproduction /></Suspense>
      },
      {
        path: 'report',
        element: <Suspense fallback={<div>加载中...</div>}><Report /></Suspense>
      }
    ]
  }
]);

export default router;