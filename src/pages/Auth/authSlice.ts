import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
};

// 登录异步 action
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // 从本地存储获取用户信息
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // 查找匹配的用户 (在实际应用中，这里应该是API调用)
      const user = users.find((u: any) => 
        u.username === credentials.email && u.password === credentials.password
      );
      
      if (!user) {
        return rejectWithValue('登录失败，请检查邮箱和密码');
      }
      
      // 创建模拟的token和用户数据
      const mockToken = `local_token_${Date.now()}`;
      const userData = {
        id: user.id,
        username: user.username,
        email: credentials.email,
        avatarUrl: user.avatarUrl || ''
      };
      
      // 保存认证信息
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { user: userData, token: mockToken };
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败');
    }
  }
);

// 注册异步 action
export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      // 从本地存储获取用户信息
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // 检查用户名是否已存在
      const existingUser = users.find((u: any) => u.username === credentials.username);
      if (existingUser) {
        return rejectWithValue('用户名已存在');
      }
      
      // 创建新用户
      const newUser = {
        id: `user${Date.now()}`,
        username: credentials.username,
        password: credentials.password,
        avatarUrl: ''
      };
      
      // 保存到本地存储
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // 创建模拟的token和用户数据
      const mockToken = `local_token_${Date.now()}`;
      const userData = {
        id: newUser.id,
        username: newUser.username,
        email: credentials.email,
        avatarUrl: ''
      };
      
      // 保存认证信息
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { user: userData, token: mockToken };
    } catch (error: any) {
      return rejectWithValue(error.message || '注册失败');
    }
  }
);

// 退出登录异步 action
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || '退出登录失败');
    }
  }
);

// 创建 slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 同步 action
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 注册
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 退出登录
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;