import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import OptimizedMainLayout from '../components/layout/OptimizedMainLayout';
import ProtectedRoute from './ProtectedRoute';

// 使用懒加载优化页面加载性能
const Auth = lazy(() => import('../pages/Auth'));
const PaperSearch = lazy(() => import('../pages/PaperSearch'));
const Favorites = lazy(() => import('../pages/Favorites'));
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
        element: <ProtectedRoute><Suspense fallback={<div>加载中...</div>}><PaperSearch /></Suspense></ProtectedRoute>
      },
      {
        path: 'favorites',
        element: <ProtectedRoute><Suspense fallback={<div>加载中...</div>}><Favorites /></Suspense></ProtectedRoute>
      },
      {
        path: 'innovation-analysis',
        element: <ProtectedRoute><Suspense fallback={<div>加载中...</div>}><InnovationAnalysis /></Suspense></ProtectedRoute>
      },
      {
        path: 'research-progress',
        element: <ProtectedRoute><Suspense fallback={<div>加载中...</div>}><ResearchProgress /></Suspense></ProtectedRoute>
      },
      {
        path: 'paper-reproduction',
        element: <ProtectedRoute><Suspense fallback={<div>加载中...</div>}><PaperReproduction /></Suspense></ProtectedRoute>
      },
      {
        path: 'report',
        element: <ProtectedRoute><Suspense fallback={<div>加载中...</div>}><Report /></Suspense></ProtectedRoute>
      }
    ]
  }
]);

export default router;