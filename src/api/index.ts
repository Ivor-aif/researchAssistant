import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import type { Paper, PaperSearchParams, InnovationPoint, UserProfile, ApiKeys } from '../types';

// 通用错误处理函数
const handleApiError = (error: unknown, context: string): never => {
  console.error(`❌ ${context}调用失败:`, error);
  
  if (error instanceof AxiosError) {
    if (error.response) {
      console.error(`❌ ${context}错误响应状态:`, error.response.status);
      console.error(`❌ ${context}错误响应数据:`, error.response.data);
    } else if (error.request) {
      console.error(`❌ ${context}请求未收到响应:`, error.request);
    } else {
      console.error(`❌ ${context}请求配置错误:`, error.message);
    }
  }
  
  throw error;
};

// 在文件顶部添加调试日志
console.log('🔌 api/index.ts - API 客户端初始化');

// 获取API基础URL
let API_BASE_URL = '';

// 根据环境变量设置API基础URL
const ENABLE_API_MOCKING = import.meta.env.VITE_ENABLE_API_MOCKING === 'true';

// 如果启用了API模拟，使用空字符串作为基础URL
if (ENABLE_API_MOCKING && import.meta.env.DEV) {
  API_BASE_URL = '';
  console.log('🔌 api/index.ts - API模拟已启用，使用空基础URL');
} else {
  // 使用配置的API基础URL
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  // 移除末尾的斜杠（如果有）
  API_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  
  // 确保API基础URL不以'/api'结尾，因为API路径已经包含了'/api'
  if (API_BASE_URL.endsWith('/api')) {
    API_BASE_URL = API_BASE_URL.slice(0, -4);
  }
  
  // 确保API基础URL以/结尾
  if (!API_BASE_URL.endsWith('/') && API_BASE_URL !== '') {
    API_BASE_URL += '/';
  }
}

// 调试输出
console.log('🔌 api/index.ts - 最终使用的API基础URL:', API_BASE_URL);
console.log('🔌 api/index.ts - API模拟状态:', ENABLE_API_MOCKING ? '启用' : '禁用');

// 如果启用了API模拟，输出日志信息
if (ENABLE_API_MOCKING) {
  console.log('🔌 API模拟已启用，将使用模拟数据而不是真实API调用');
  console.log('🔌 原始API基础URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
  console.log('🔌 处理后的API基础URL:', API_BASE_URL);
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 增加超时时间
  timeout: 30000,
});

// 添加请求拦截器，用于调试
apiClient.interceptors.request.use(
  (config) => {
    // 构建完整URL用于调试
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('🔍 API请求URL:', fullUrl);
    console.log('🔍 API请求方法:', config.method?.toUpperCase());
    console.log('🔍 API请求参数:', config.params || '无');
    console.log('🔍 API请求数据:', config.data || '无');
    
    // 添加认证令牌（如果存在）
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器，用于调试
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API响应状态:', response.status);
    console.log('✅ API响应数据:', response.data ? '有数据' : '无数据');
    return response;
  },
  (error: unknown) => {
    if (error instanceof AxiosError) {
      console.error('❌ API响应错误:', error.message);
      if (error.response) {
        console.error('❌ API错误状态:', error.response.status);
        console.error('❌ API错误数据:', error.response.data);
      } else if (error.request) {
        console.error('❌ API请求未收到响应:', error.request);
      } else {
        console.error('❌ API请求配置错误:', error.message);
      }
    } else {
      console.error('❌ API响应错误:', error);
    }
    return Promise.reject(error);
  }
);

// 论文API
export const paperApi = {
  // 搜索论文
  search: async (params: PaperSearchParams): Promise<{ papers: Paper[], total: number }> => {
    console.log('📚 调用论文搜索API，参数:', params);
    try {
      const response = await apiClient.get('/research/papers', { params });
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '论文搜索API');
    }
  },
  
  // 从arXiv搜索论文
  searchArxiv: async (query: string): Promise<{ papers: Paper[], total: number }> => {
    console.log('📚 调用arXiv论文搜索API，查询:', query);
    try {
      const response = await apiClient.get('/research/papers/arxiv', { params: { query } });
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, 'arXiv论文搜索API');
    }
  },
  
  // 从自定义源搜索论文
  searchCustom: async (query: string, source: string): Promise<{ papers: Paper[], total: number }> => {
    console.log('📚 调用自定义源论文搜索API，查询:', query, '源:', source);
    try {
      const response = await apiClient.get('/research/papers/custom', { 
        params: { query, source } 
      });
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '自定义源论文搜索API');
    }
  },
  
  // 获取论文详情
  getDetail: async (id: string): Promise<Paper> => {
    console.log('📄 调用论文详情API，ID:', id);
    try {
      const response = await apiClient.get(`/research/papers/${id}`);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '论文详情API');
    }
  },
  
  // 保存论文
  save: async (paper: Paper): Promise<Paper> => {
    console.log('💾 调用论文保存API');
    try {
      const response = await apiClient.post('/research/papers/save', paper);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '论文保存API');
    }
  },
};

// 创新点分析相关API
// 创新分析API
export const innovationApi = {
  // 分析文本中的创新点
  analyzeText: async (text: string): Promise<{ innovation_points: InnovationPoint[], summary: string }> => {
    console.log('🧠 调用创新点分析API，文本长度:', text.length);
    try {
      const response = await apiClient.post('/research/innovation/analyze', { text });
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '创新点分析API');
    }
  },
  
  // 分析上传的文件中的创新点
  analyzeFile: async (file: File): Promise<{ innovation_points: InnovationPoint[], summary: string }> => {
    console.log('📄 调用文件创新点分析API，文件名:', file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 文件上传可能需要更长的超时时间
      const response = await apiClient.post('/ai/extract-innovations-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3分钟超时
      });
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '文件创新点分析API');
    }
  },
};

// 用户API
export const userApi = {
  // 用户登录
  login: async (email: string, password: string): Promise<{ token: string, user: UserProfile }> => {
    console.log('🔑 调用用户登录API，邮箱:', email);
    console.log('🔑 API基础URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
    console.log('🔑 API模拟状态:', import.meta.env.VITE_ENABLE_API_MOCKING === 'true' ? '启用' : '禁用');
    try {
      // 使用表单格式发送请求
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      console.log('🔑 发送登录请求，表单数据:', { username: email, password: '******' });
      console.log('🔑 请求URL:', `${API_BASE_URL}auth/token`);
      
      const response = await apiClient.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log('🔑 登录响应状态:', response.status);
      console.log('🔑 登录响应数据:', JSON.stringify(response.data));
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '用户登录API');
    }
  },
  
  // 用户注册
  register: async (userData: { email: string, password: string, fullName: string }): Promise<{ token: string, user: UserProfile }> => {
    console.log('📝 调用用户注册API，邮箱:', userData.email);
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '用户注册API');
    }
  },
  
  // 获取用户资料
  getProfile: async (): Promise<UserProfile> => {
    console.log('👤 调用获取用户资料API');
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '获取用户资料API');
    }
  },
  
  // 更新用户资料
  updateProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    console.log('✏️ 调用更新用户资料API');
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '更新用户资料API');
    }
  },
  
  // 获取API密钥
  getApiKeys: async (): Promise<ApiKeys> => {
    console.log('🔑 调用获取API密钥API');
    try {
      const response = await apiClient.get('/auth/api-keys');
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '获取API密钥API');
    }
  },
  
  // 更新API密钥
  updateApiKeys: async (keys: Partial<ApiKeys>): Promise<ApiKeys> => {
    console.log('🔄 调用更新API密钥API');
    try {
      const response = await apiClient.put('/auth/api-keys', keys);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '更新API密钥API');
    }
  },
};

// AI服务相关API
// AI助手API
export const aiApi = {
  // 发送消息给AI助手
  sendMessage: async (message: string, conversationId?: string): Promise<{ reply: string, conversation_id: string }> => {
    console.log('💬 调用AI助手API，消息长度:', message.length);
    try {
      const response = await apiClient.post('/ai/chat', { 
        message, 
        conversation_id: conversationId 
      });
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, 'AI助手API');
    }
  },
  
  // 获取对话历史
  getConversationHistory: async (conversationId: string): Promise<{ messages: any[] }> => {
    console.log('📜 调用获取对话历史API，对话ID:', conversationId);
    try {
      const response = await apiClient.get(`/ai/conversations/${conversationId}`);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '获取对话历史API');
    }
  },
  
  // 获取对话列表
  getConversations: async (): Promise<{ conversations: any[] }> => {
    console.log('📚 调用获取对话列表API');
    try {
      const response = await apiClient.get('/ai/conversations');
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '获取对话列表API');
    }
  },
  
  // 创建新对话
  createConversation: async (title: string): Promise<any> => {
    console.log('➕ 调用创建对话API，标题:', title);
    try {
      const response = await apiClient.post('/ai/conversations', { title });
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '创建对话API');
    }
  },
  
  // 删除对话
  deleteConversation: async (conversationId: string): Promise<void> => {
    console.log('🗑️ 调用删除对话API，对话ID:', conversationId);
    try {
      await apiClient.delete(`/ai/conversations/${conversationId}`);
    } catch (error: unknown) {
      return handleApiError(error, '删除对话API');
    }
  },
  
  // 获取API密钥
  getApiKeys: async (): Promise<ApiKeys> => {
    console.log('🔑 调用获取AI API密钥API');
    try {
      const response = await apiClient.get('/ai/api-keys');
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '获取AI API密钥API');
    }
  },
  
  // 更新API密钥
  updateApiKeys: async (apiKeys: Partial<ApiKeys>): Promise<ApiKeys> => {
    console.log('🔄 调用更新AI API密钥API');
    try {
      const response = await apiClient.post('/ai/api-keys', apiKeys);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '更新AI API密钥API');
    }
  }
};

// 项目API
export const projectApi = {
  // 获取项目列表
  getProjects: async (): Promise<any[]> => {
    console.log('📋 调用获取项目列表API');
    try {
      const response = await apiClient.get('/research/projects');
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '获取项目列表API');
      console.error('❌ 获取项目列表API调用失败:', error);
      throw error;
    }
  },
  
  // 获取项目详情
  getProject: async (id: string): Promise<any> => {
    console.log('📁 调用获取项目详情API，ID:', id);
    try {
      const response = await apiClient.get(`/research/projects/${id}`);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '获取项目详情API');
    }
  },
  
  // 创建新项目
  createProject: async (project: any): Promise<any> => {
    console.log('➕ 调用创建项目API');
    try {
      const response = await apiClient.post('/research/projects', project);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '创建项目API');
    }
  },
  
  // 更新项目
  updateProject: async (id: string, project: any): Promise<any> => {
    console.log('✏️ 调用更新项目API，ID:', id);
    try {
      const response = await apiClient.put(`/research/projects/${id}`, project);
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error, '更新项目API');
    }
  },
  
  // 删除项目
  deleteProject: async (id: string): Promise<void> => {
    console.log('🗑️ 调用删除项目API，ID:', id);
    try {
      await apiClient.delete(`/research/projects/${id}`);
    } catch (error: unknown) {
      return handleApiError(error, '删除项目API');
    }
  },
};

// 研究进度API
export const progressApi = {
  // 获取项目列表
  getProjects: async () => {
    console.log('📋 调用获取研究进度API');
    try {
      const response = await apiClient.get('/research/progress');
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '获取研究进度API');
    }
  },
  
  // 创建新进度
  createProgress: async (progressData: any) => {
    console.log('➕ 调用创建研究进度API');
    try {
      const response = await apiClient.post('/research/progress', progressData);
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '创建研究进度API');
    }
  },
  
  // 创建新项目（为了兼容ResearchProgress页面）
  createProject: async (projectData: any) => {
    console.log('➕ 调用创建研究项目API');
    try {
      const response = await apiClient.post('/research/progress', projectData);
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '创建研究项目API');
    }
  },
  
  // 更新进度
  updateProgress: async (id: string, progressData: any) => {
    console.log('✏️ 调用更新研究进度API，ID:', id);
    try {
      const response = await apiClient.put(`/research/progress/${id}`, progressData);
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '更新研究进度API');
    }
  },
  
  // 删除进度
  deleteProgress: async (id: string) => {
    console.log('🗑️ 调用删除研究进度API，ID:', id);
    try {
      const response = await apiClient.delete(`/research/progress/${id}`);
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '删除研究进度API');
    }
  }
};

// 报告API
export const reportApi = {
  // 生成报告
  generateReport: async (reportData: any) => {
    console.log('📝 调用生成报告API');
    try {
      const response = await apiClient.post('/research/reports/generate', reportData);
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '生成报告API');
    }
  },
  
  // 获取报告列表
  getReports: async () => {
    console.log('📋 调用获取报告列表API');
    try {
      const response = await apiClient.get('/research/reports');
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '获取报告列表API');
    }
  },
  
  // 获取报告详情
  getReport: async (id: string) => {
    console.log('📄 调用获取报告详情API，ID:', id);
    try {
      const response = await apiClient.get(`/research/reports/${id}`);
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '获取报告详情API');
    }
  },
  
  // 导出报告
  exportReport: async (id: string, format: string) => {
    console.log('📤 调用导出报告API，ID:', id, '格式:', format);
    try {
      const response = await apiClient.get(`/research/reports/${id}/export`, {
        params: { format },
        responseType: 'blob'
      });
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '导出报告API');
    }
  },
  
  // 下载报告（为了兼容Report页面）
  downloadReport: async (reportData: any) => {
    console.log('📥 调用下载报告API');
    try {
      // 这里假设下载报告API的路径和参数
      const response = await apiClient.post('/research/reports/download', reportData);
      return response;
    } catch (error: unknown) {
      return handleApiError(error, '下载报告API');
    }
  }
};

// 所有API已经通过命名导出，不需要默认导出