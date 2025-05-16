import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 开发环境下的错误处理
if (import.meta.env.DEV) {
  console.log('API运行在开发环境，API基础URL:', api.defaults.baseURL);
}

// 请求拦截器 - 可以在这里添加认证token等
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    // 开发环境下打印错误信息
    if (import.meta.env.DEV) {
      console.error('API请求错误:', error.message);
    }
    
    // 根据错误状态码处理不同情况
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      if (status === 401) {
        // 未授权，可能需要重新登录
        console.warn('用户未授权，请重新登录');
      } else if (status === 404) {
        // 资源不存在
        console.warn('请求的资源不存在');
      } else if (status >= 500) {
        // 服务器错误
        console.warn('服务器错误，请稍后再试');
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.warn('无法连接到服务器，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

// 论文检索相关API
export const paperApi = {
  // 搜索论文
  searchPapers: (query: string) => api.get('/research/papers', { params: { query } }),
  // 获取论文详情
  getPaperDetail: (id: string) => api.get(`/research/papers/${id}`),
  // 保存论文
  savePaper: (paperId: string) => api.post('/research/papers/save', { paper_id: paperId })
};

// 创新点分析相关API
export const innovationApi = {
  // 分析论文创新点
  analyzeInnovation: (paperId: string) => api.post('/research/innovation/analyze', { paper_id: paperId }),
  // 获取创新点列表
  getInnovationPoints: (projectId: string) => api.get(`/research/innovation/points/${projectId}`)
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

export default {
  paperApi,
  innovationApi,
  progressApi,
  reportApi
};