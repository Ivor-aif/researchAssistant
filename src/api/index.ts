import axios from 'axios';
import { Paper, PaperSearchParams, InnovationPoint, UserProfile, ApiKeys } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 默认30秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器，添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    // 开发环境下打印错误信息
    if (import.meta.env.DEV) {
      console.error('API请求错误:', error.message);
    }
    
    // 导入message组件
    import('antd').then(({ message }) => {
      // 根据错误状态码处理不同情况
      if (error.response) {
        // 服务器返回了错误状态码
        const status = error.response.status;
        const errorData = error.response.data;
        
        // 获取错误信息
        let errorMessage = '操作失败';
        
        // 尝试从响应中提取错误信息
        if (errorData) {
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : '操作失败';
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        }
        
        if (status === 401) {
          // 未授权，可能需要重新登录
          setTimeout(() => {
            message.error('用户未授权，请重新登录');
          }, 100);
          console.warn('用户未授权，请重新登录');
        } else if (status === 404) {
          // 资源不存在
          setTimeout(() => {
            message.error('请求的资源不存在');
          }, 100);
          console.warn('请求的资源不存在');
        } else if (status >= 500) {
          // 服务器错误
          setTimeout(() => {
            message.error(`服务器错误: ${errorMessage}`);
          }, 100);
          console.warn('服务器错误，请稍后再试');
        } else {
          // 其他错误
          setTimeout(() => {
            message.error(errorMessage);
          }, 100);
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        setTimeout(() => {
          message.error('无法连接到服务器，请检查网络连接');
        }, 100);
        console.warn('无法连接到服务器，请检查网络连接');
      } else {
        // 其他错误
        setTimeout(() => {
          message.error(`请求错误: ${error.message}`);
        }, 100);
      }
    });
    
    return Promise.reject(error);
  }
);

// 论文检索相关API
export const paperApi = {
  // 搜索论文
  searchPapers: (query: string, sources?: string[]) => api.get('/research/papers', { 
    params: { query, sources: sources?.join(',') } 
  }),
  // 从arXiv搜索论文
  searchArxiv: (query: string) => api.get('/research/papers/arxiv', { params: { query } }),
  // 从自定义源搜索论文
  searchCustomSource: (query: string, sourceUrl: string) => api.get('/research/papers/custom', { 
    params: { query, source_url: sourceUrl } 
  }),
  // 获取论文详情
  getPaperDetail: (id: string) => api.get(`/research/papers/${id}`),
  // 保存论文
  savePaper: (paperId: string) => api.post('/research/papers/save', { paper_id: paperId })
};

// 创新点分析相关API
export const innovationApi = {
  // 分析论文创新点（通过ID/DOI）
  analyzeInnovation: (paperId: string) => api.post('/research/innovation/analyze', { paper_id: paperId }),
  // 分析上传文件的创新点
  analyzeFileInnovation: (formData: FormData) => {
    return api.post('/ai/extract-innovations-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 180000 // 增加超时时间到180秒
    });
  },
  // 获取创新点列表
  getInnovationPoints: (projectId: string) => api.get(`/research/innovation/points/${projectId}`),
  // 分析创新点可行性
  analyzeFeasibility: (innovation: any) => api.post('/ai/analyze-feasibility', innovation)
};

// 研究进度相关API
export const progressApi = {
  // 获取研究项目列表
  getProjects: () => api.get('/research/projects'),
  // 创建研究项目
  createProject: (projectData: any) => api.post('/research/projects', projectData),
  // 更新研究进度
  updateProgress: (progressData: any) => api.post('/research/progress', progressData),
  // 获取研究进度
  getProgress: (projectId: string) => api.get(`/research/progress/${projectId}`)
};

// 报告生成相关API
export const reportApi = {
  // 生成研究报告
  generateReport: (reportData: any) => api.post('/research/report/generate', reportData),
  // 获取报告列表
  getReports: () => api.get('/research/reports'),
  // 获取报告详情
  getReportDetail: (reportId: string) => api.get(`/research/reports/${reportId}`),
  // 下载报告
  downloadReport: (reportData: any) => api.post('/research/report/download', reportData)
};

// 用户相关API
export const userApi = {
  // 获取当前用户信息
  getCurrentUser: () => api.get('/auth/me'),
  // 更新用户个人资料
  updateProfile: (profileData: Partial<UserProfile>) => api.post('/auth/update-profile', profileData),
  // 更新密码
  updatePassword: (currentPassword: string, newPassword: string) => api.post('/auth/update-password', {
    current_password: currentPassword,
    new_password: newPassword
  })
};

// AI服务相关API
export const aiApi = {
  // 获取API密钥
  getApiKeys: () => api.get('/ai/api-keys'),
  // 更新API密钥
  updateApiKeys: (apiKeys: Partial<ApiKeys>) => api.post('/ai/api-keys', apiKeys)
};

export default {
  paperApi,
  innovationApi,
  progressApi,
  reportApi,
  userApi,
  aiApi
};