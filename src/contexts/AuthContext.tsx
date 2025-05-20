import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
// 移除axios导入，因为我们将使用本地存储

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
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
      // 从本地存储获取用户信息
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // 查找匹配的用户
      const user = users.find((u: any) => 
        u.username === username && u.password === password
      );
      
      if (!user) {
        message.error('登录失败，请检查用户名和密码');
        return false;
      }
      
      // 创建模拟的token和用户数据
      const mockToken = `local_token_${Date.now()}`;
      const userData = {
        id: user.id,
        username: user.username
      };
      
      // 保存认证信息
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(mockToken);
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
      // 从本地存储获取现有用户
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // 检查用户名是否已存在
      if (users.some((user: any) => user.username === username)) {
        message.error('用户名已存在，请使用其他用户名');
        return false;
      }
      
      // 创建新用户
      const newUser = {
        id: Date.now(), // 使用时间戳作为ID
        username,
        password // 注意：实际应用中应该加密密码
      };
      
      // 将新用户添加到用户列表
      users.push(newUser);
      
      // 保存到本地存储
      localStorage.setItem('users', JSON.stringify(users));
      
      message.success('注册成功，请登录');
      return true;
    } catch (error: any) {
      console.error('注册失败:', error);
      message.error('注册失败，请稍后重试');
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