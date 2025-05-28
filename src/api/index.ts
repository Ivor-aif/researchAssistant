import axios from 'axios';
import { Paper, PaperSearchParams, InnovationPoint, UserProfile, ApiKeys } from '../types';

// 在文件顶部添加调试日志
console.log('🔌 api/index.ts - API 客户端初始化');

// 获取API基础URL
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
// 移除末尾的斜杠（如果有）
API_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// 调试输出
console.log('🔌 api/index.ts - API基础URL:', API_BASE_URL);

// 如果API_BASE_URL以'/api'结尾，则移除它，因为API路径已经包含了'/api'
if (API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = API_BASE_URL.slice(0, -4);
}

const ENABLE_API_MOCKING = import.meta.env.VITE_ENABLE_API_MOCKING === 'true';

// 如果启用了API模拟，输出日志信息
if (ENABLE_API_MOCKING) {
  console.log('API模拟已启用，将使用模拟数据而不是真实API调用');
  console.log('原始API基础URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api');
  console.log('处理后的API基础URL:', API_BASE_URL);
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (error) => {
    console.error('❌ API响应错误:', error.message);
    if (error.response) {
      console.error('❌ API错误状态:', error.response.status);
      console.error('❌ API错误数据:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// 论文API
export const paperApi = {
  // 搜索论文
  search: async (params: PaperSearchParams): Promise<{ papers: Paper[], total: number }> => {
    console.log('📚 调用论文搜索API，参数:', params);
    const response = await apiClient.get('/research/papers', { params });
    return response.data;
  },
  
  // 从arXiv搜索论文
  searchArxiv: async (query: string): Promise<{ papers: Paper[], total: number }> => {
    console.log('📚 调用arXiv论文搜索API，查询:', query);
    const response = await apiClient.get('/research/papers/arxiv', { params: { query } });
    return response.data;
  },
  
  // 从自定义源搜索论文
  searchCustom: async (query: string, source: string): Promise<{ papers: Paper[], total: number }> => {
    console.log('📚 调用自定义源论文搜索API，查询:', query, '源:', source);
    const response = await apiClient.get('/research/papers/custom', { 
      params: { query, source } 
    });
    return response.data;
  },
  
  // 获取论文详情
  getDetail: async (id: string): Promise<Paper> => {
    console.log('📄 调用论文详情API，ID:', id);
    const response = await apiClient.get(`/research/papers/${id}`);
    return response.data;
  },
  
  // 保存论文
  save: async (paper: Paper): Promise<Paper> => {
    console.log('💾 调用论文保存API');
    const response = await apiClient.post('/research/papers/save', paper);
    return response.data;
  },
};

// 创新点分析相关API
// 创新分析API
export const innovationApi = {
  // 分析文本中的创新点
  analyzeText: async (text: string): Promise<{ innovation_points: InnovationPoint[], summary: string }> => {
    console.log('🧠 调用创新点分析API，文本长度:', text.length);
    const response = await apiClient.post('/research/innovation/analyze', { text });
    return response.data;
  },
  
  // 分析上传的文件中的创新点
  analyzeFile: async (file: File): Promise<{ innovation_points: InnovationPoint[], summary: string }> => {
    console.log('📄 调用文件创新点分析API，文件名:', file.name);
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
  },
};

// 研究进度相关API已移除，使用 projectApi 替代

// 报告生成相关API已移除

// 用户API
export const userApi = {
  // 用户登录
  login: async (email: string, password: string): Promise<{ token: string, user: UserProfile }> => {
    console.log('🔑 调用用户登录API，邮箱:', email);
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  // 用户注册
  register: async (userData: { email: string, password: string, fullName: string }): Promise<{ token: string, user: UserProfile }> => {
    console.log('📝 调用用户注册API，邮箱:', userData.email);
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  // 获取用户资料
  getProfile: async (): Promise<UserProfile> => {
    console.log('👤 调用获取用户资料API');
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
  
  // 更新用户资料
  updateProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    console.log('✏️ 调用更新用户资料API');
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  },
  
  // 获取API密钥
  getApiKeys: async (): Promise<ApiKeys> => {
    console.log('🔑 调用获取API密钥API');
    const response = await apiClient.get('/auth/api-keys');
    return response.data;
  },
  
  // 更新API密钥
  updateApiKeys: async (keys: Partial<ApiKeys>): Promise<ApiKeys> => {
    console.log('🔄 调用更新API密钥API');
    const response = await apiClient.put('/auth/api-keys', keys);
    return response.data;
  },
};

// AI服务相关API
// AI助手API
export const aiApi = {
  // 发送消息给AI助手
  sendMessage: async (message: string, conversationId?: string): Promise<{ reply: string, conversation_id: string }> => {
    console.log('💬 调用AI助手API，消息长度:', message.length);
    const response = await apiClient.post('/ai/chat', { 
      message, 
      conversation_id: conversationId 
    });
    return response.data;
  },
  
  // 获取对话历史
  getConversationHistory: async (conversationId: string): Promise<{ messages: ChatMessage[] }> => {
    console.log('📜 调用获取对话历史API，对话ID:', conversationId);
    const response = await apiClient.get(`/ai/conversations/${conversationId}`);
    return response.data;
  },
  
  // 获取对话列表
  getConversations: async (): Promise<{ conversations: Conversation[] }> => {
    console.log('📚 调用获取对话列表API');
    const response = await apiClient.get('/ai/conversations');
    return response.data;
  },
  
  // 创建新对话
  createConversation: async (title: string): Promise<Conversation> => {
    console.log('➕ 调用创建对话API，标题:', title);
    const response = await apiClient.post('/ai/conversations', { title });
    return response.data;
  },
  
  // 删除对话
  deleteConversation: async (conversationId: string): Promise<void> => {
    console.log('🗑️ 调用删除对话API，对话ID:', conversationId);
    await apiClient.delete(`/ai/conversations/${conversationId}`);
  },
  
  // 获取API密钥
  getApiKeys: async (): Promise<ApiKeys> => {
    console.log('🔑 调用获取AI API密钥API');
    const response = await apiClient.get('/ai/api-keys');
    return response.data;
  },
  
  // 更新API密钥
  updateApiKeys: async (apiKeys: Partial<ApiKeys>): Promise<ApiKeys> => {
    console.log('🔄 调用更新AI API密钥API');
    const response = await apiClient.post('/ai/api-keys', apiKeys);
    return response.data;
  }
};

// 项目API
export const projectApi = {
  // 获取项目列表
  getProjects: async (): Promise<Project[]> => {
    console.log('📋 调用获取项目列表API');
    const response = await apiClient.get('/research/projects');
    return response.data;
  },
  
  // 获取项目详情
  getProject: async (id: string): Promise<Project> => {
    console.log('📁 调用获取项目详情API，ID:', id);
    const response = await apiClient.get(`/research/projects/${id}`);
    return response.data;
  },
  
  // 创建新项目
  createProject: async (project: Partial<Project>): Promise<Project> => {
    console.log('➕ 调用创建项目API');
    const response = await apiClient.post('/research/projects', project);
    return response.data;
  },
  
  // 更新项目
  updateProject: async (id: string, project: Partial<Project>): Promise<Project> => {
    console.log('✏️ 调用更新项目API，ID:', id);
    const response = await apiClient.put(`/research/projects/${id}`, project);
    return response.data;
  },
  
  // 删除项目
  deleteProject: async (id: string): Promise<void> => {
    console.log('🗑️ 调用删除项目API，ID:', id);
    await apiClient.delete(`/research/projects/${id}`);
  },
};

// 导出所有API
export default {
  paperApi,
  innovationApi,
  userApi,
  projectApi,
  aiApi
};