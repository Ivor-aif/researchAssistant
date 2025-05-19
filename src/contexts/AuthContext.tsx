import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // 初始化时从本地存储加载认证状态
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // 登录函数
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/auth/token`,
        new URLSearchParams({
          username,
          password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token } = response.data;
      
      // 获取用户信息
      const userResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const userData = userResponse.data;
      
      // 保存认证信息
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      message.success('登录成功');
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请检查用户名和密码');
      return false;
    }
  };

  // 注册函数
  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/auth/register`,
        { username, password }
      );
      
      message.success('注册成功，请登录');
      return true;
    } catch (error: any) {
      console.error('注册失败:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        message.error(`注册失败: ${error.response.data.detail}`);
      } else {
        message.error('注册失败，请稍后重试');
      }
      return false;
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    message.success('已退出登录');
  };

  const value = {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};