import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// 受保护的路由组件，只有登录用户才能访问
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // 开发模式下临时绕过认证检查
  const isDevelopment = import.meta.env.DEV;
  
  // 如果是开发模式或用户已登录，显示子组件
  if (isDevelopment || isAuthenticated) {
    return <>{children}</>;
  }
  
  // 如果用户未登录且不是开发模式，重定向到登录页面
  return <Navigate to="/auth" replace />;
};

export default ProtectedRoute;