import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { message } from 'antd';
import { userApi } from '../api';
import type { UserProfile } from '../types';

interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  institution?: string;
  researchInterests?: string[];
  bio?: string;
  avatarUrl?: string;
  author_name?: string;
  author_email?: string;
  author_website?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>;
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

// 初始化本地存储中的用户列表（如果不存在）
const initializeLocalStorage = () => {
  try {
    // 检查是否已经有用户列表
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) {
      // 创建默认用户
      const defaultUsers = [
        {
          id: 'user1',
          username: 'admin',
          password: 'admin123',
          avatarUrl: ''
        }
      ];
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      console.log('已初始化默认用户');
    }
  } catch (error: unknown) {
    console.error('初始化本地存储失败:', error);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 初始化本地存储
  useEffect(() => {
    try {
      initializeLocalStorage();
      
      // 在开发环境中自动设置为已认证状态
      if (import.meta.env.DEV) {
        console.log('开发环境：自动设置认证状态');
        const defaultUser = {
          id: 'user1',
          username: 'admin',
          avatarUrl: ''
        };
        setUser(defaultUser);
        localStorage.setItem('currentUser', JSON.stringify(defaultUser));
        
        // 设置开发环境token
        const devToken = 'dev_token_' + Date.now();
        setToken(devToken);
        localStorage.setItem('token', devToken);
        
        // 设置认证状态
        setIsAuthenticated(true);
      } else {
        // 从本地存储恢复用户会话
        const storedUser = localStorage.getItem('currentUser');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          setIsAuthenticated(true);
        }
      }
      
      // 确保在组件挂载后立即设置loading为false
      // 使用setTimeout确保在下一个事件循环中执行，给React有足够时间更新DOM
      setTimeout(() => {
        setLoading(false);
        console.log('Auth loading set to false');
      }, 0);
    } catch (error: unknown) {
      console.error('初始化认证状态失败:', error);
      setLoading(false);
    }
  }, []);

  // 初始化时从本地存储加载认证状态
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error: unknown) {
          console.error('解析存储的用户数据失败:', error);
          // 清除无效的存储数据
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (error: unknown) {
      console.error('加载认证状态失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 登录函数
  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('AuthContext.login - 开始登录流程，用户名:', username);
    try {
      // 调用API进行登录验证
      console.log('AuthContext.login - 调用 userApi.login');
      console.log('AuthContext.login - API基础URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
      console.log('AuthContext.login - API模拟状态:', import.meta.env.VITE_ENABLE_API_MOCKING === 'true' ? '启用' : '禁用');
      
      const response = await userApi.login(username, password);
      console.log('AuthContext.login - API响应:', response ? '有响应' : '无响应');
      console.log('AuthContext.login - API响应详情:', JSON.stringify(response));
      
      if (!response || !response.token) {
        console.error('AuthContext.login - 登录失败: 无效的响应或缺少token');
        message.error('登录失败，请检查用户名和密码');
        return false;
      }
      
      console.log('AuthContext.login - 登录成功，保存认证信息');
      // 保存认证信息
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      console.log('AuthContext.login - 认证信息已保存到本地存储');
      
      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      console.log('AuthContext.login - 状态已更新: token, user, isAuthenticated');
      
      message.success('登录成功');
      console.log('AuthContext.login - 认证状态已更新，isAuthenticated:', true);
      return true;
    } catch (error: unknown) {
      console.error('AuthContext.login - 登录失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '登录失败，请检查用户名和密码';
      
      // 尝试从错误对象中提取更详细的错误信息
      if (error && typeof error === 'object' && 'response' in error && error.response && 
          typeof error.response === 'object' && 'data' in error.response && error.response.data) {
        const errorData = error.response.data;
        console.error('AuthContext.login - 错误响应数据:', errorData);
        if (typeof errorData === 'object' && errorData !== null) {
          if ('error' in errorData && typeof errorData.error === 'object' && errorData.error !== null && 
              'message' in errorData.error && typeof errorData.error.message === 'string') {
            errorMessage = errorData.error.message;
          } else if ('message' in errorData && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if ('error' in errorData) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
          } else if ('detail' in errorData && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        }
      } else if (error && typeof error === 'object' && 'request' in error) {
        console.error('AuthContext.login - 请求发送但未收到响应:', error.request);
        errorMessage = '服务器未响应，请稍后再试';
      } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        console.error('AuthContext.login - 请求配置错误:', error.message);
        errorMessage = '请求配置错误: ' + error.message;
       }
       
       message.error(errorMessage);
      return false;
    }
  };

  // 注册函数
  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      // 从本地存储获取用户信息
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // 检查用户名是否已存在
      const existingUser = users.find((u: any) => u.username === username);
      if (existingUser) {
        message.error('用户名已存在');
        return false;
      }
      
      // 创建新用户
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map((u: any) => u.id)) + 1 : 1,
        username,
        password,
        avatarUrl: ''
      };
      
      // 更新用户列表
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // 自动登录
      const mockToken = `local_token_${Date.now()}`;
      const userData = {
        id: String(newUser.id),
        username: newUser.username,
        avatarUrl: newUser.avatarUrl
      };
      
      // 保存认证信息
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(mockToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      message.success('注册成功');
      return true;
    } catch (error: unknown) {
      console.error('注册失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '注册失败，请稍后重试';
      
      // 尝试从错误对象中提取更详细的错误信息
      if (error && typeof error === 'object' && 'response' in error && error.response && 
          typeof error.response === 'object' && 'data' in error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null && 
            'error' in errorData && typeof errorData.error === 'object' && errorData.error !== null && 
            'message' in errorData.error && typeof errorData.error.message === 'string') {
          errorMessage = errorData.error.message;
        } else if (typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
        } else if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      }
      
      message.error(errorMessage);
      return false;
    }
  };

  // 登出函数
  const logout = () => {
    // 清除本地存储中的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 重置状态
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    message.success('已退出登录');
  };

  // 更新用户信息
  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    try {
      if (!user) {
        message.error('用户未登录');
        return false;
      }
      
      // 更新本地存储中的用户信息
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // 如果更新了用户名，同时更新用户列表中的用户名
      if (updates.username) {
        const storedUsers = localStorage.getItem('users');
        const users = storedUsers ? JSON.parse(storedUsers) : [];
        
        const updatedUsers = users.map((u: any) => 
          u.id === user.id ? { ...u, username: updates.username } : u
        );
        
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      }
      
      // 更新状态
      setUser(updatedUser);
      
      message.success('用户信息已更新');
      return true;
    } catch (error: unknown) {
      console.error('更新用户信息失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '更新用户信息失败，请稍后重试';
      
      // 尝试从错误对象中提取更详细的错误信息
      if (error && typeof error === 'object' && 'response' in error && error.response && 
          typeof error.response === 'object' && 'data' in error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null && 
            'error' in errorData && typeof errorData.error === 'object' && errorData.error !== null && 
            'message' in errorData.error && typeof errorData.error.message === 'string') {
          errorMessage = errorData.error.message;
        } else if (typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
        } else if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      }
      
      message.error(errorMessage);
      return false;
    }
  };

  // 更新用户个人资料
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (!user || !isAuthenticated) {
        message.error('用户未登录');
        return false;
      }
      
      // 调用API更新个人资料
      // 在实际项目中，这里应该调用后端API
      // const response = await userApi.updateProfile(profileData);
      
      // 模拟API调用成功
      // 更新本地存储中的用户信息
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // 更新状态
      setUser(updatedUser);
      
      message.success('个人资料已更新');
      return true;
    } catch (error: unknown) {
      console.error('更新个人资料失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '更新个人资料失败，请稍后重试';
      
      // 尝试从错误对象中提取更详细的错误信息
      if (error && typeof error === 'object' && 'response' in error && error.response && 
          typeof error.response === 'object' && 'data' in error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null && 
            'error' in errorData && typeof errorData.error === 'object' && errorData.error !== null && 
            'message' in errorData.error && typeof errorData.error.message === 'string') {
          errorMessage = errorData.error.message;
        } else if (typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
        } else if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      }
      
      message.error(errorMessage);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        updateProfile
      }}
    >
      {!loading ? children : <div>加载认证状态...</div>}
    </AuthContext.Provider>
  );
};