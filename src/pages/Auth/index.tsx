import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Login from './Login';
import UserProfile from './UserProfile';

const Auth: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // 如果用户已登录，显示用户资料页面
  if (isAuthenticated) {
    return <UserProfile />;
  }
  
  // 如果用户未登录，显示登录页面
  return <Login />;
};

export default Auth;