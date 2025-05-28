import { http, HttpResponse, delay } from 'msw'
import { Paper, UserProfile } from '../types'

// 模拟数据
const mockPapers: Paper[] = [
  {
    id: 'paper1',
    title: '人工智能在学术研究中的应用',
    authors: ['张三', '李四'],
    abstract: '本文探讨了人工智能技术在现代学术研究中的应用和影响...',
    keywords: ['人工智能', '学术研究', '技术应用'],
    year: 2023,
    journal: '计算机科学与技术',
    citations: 45,
    source: 'arXiv',
    url: 'https://example.com/paper1',
    isFavorite: false
  },
  {
    id: 'paper2',
    title: '深度学习在自然语言处理中的最新进展',
    authors: ['王五', '赵六'],
    abstract: '本研究综述了深度学习技术在自然语言处理领域的最新进展和应用案例...',
    keywords: ['深度学习', '自然语言处理', 'NLP'],
    year: 2022,
    journal: '人工智能学报',
    citations: 78,
    source: 'IEEE',
    url: 'https://example.com/paper2',
    isFavorite: true
  },
  {
    id: 'paper3',
    title: '机器学习算法在医疗诊断中的应用研究',
    authors: ['钱七', '孙八'],
    abstract: '本文研究了机器学习算法在医疗诊断领域的应用，并提出了一种新的诊断模型...',
    keywords: ['机器学习', '医疗诊断', '算法研究'],
    year: 2023,
    journal: '生物医学工程学报',
    citations: 32,
    source: 'PubMed',
    url: 'https://example.com/paper3',
    isFavorite: false
  }
]

// 模拟用户数据
const mockUser: UserProfile = {
  id: 'user1',
  username: 'researcher',
  email: 'researcher@example.com',
  fullName: '研究员',
  institution: '某研究机构',
  researchInterests: ['人工智能', '机器学习', '自然语言处理'],
  bio: '专注于AI领域研究的学者',
  avatarUrl: 'https://example.com/avatar.jpg'
}

// 模拟创新点数据
const mockInnovationPoints = [
  {
    id: '1',
    title: '改进的注意力机制',
    description: '本文提出了一种新的注意力机制，能够更有效地捕捉长距离依赖关系。',
    significance: '该创新点显著提高了模型在长文本处理任务上的性能，比基准模型提升了15%。',
    relevance: 5,
    technical_feasibility: 8.5,
    implementation_difficulty: '中等',
    novelty_score: 9.2
  },
  {
    id: '2',
    title: '轻量级模型架构',
    description: '作者设计了一种计算效率更高的模型架构，通过知识蒸馏和参数共享技术，减少了50%的参数量。',
    significance: '该创新使模型能够在资源受限的设备上运行，同时保持较高的性能水平。',
    relevance: 4,
    technical_feasibility: 7.5,
    implementation_difficulty: '较难',
    novelty_score: 8.0
  }
]

// 获取API基础URL
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
// 移除基础URL中可能的尾部斜杠
API_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// 如果API_BASE_URL以'/api'结尾，则移除它，因为API客户端中的路径已经包含了'/api'
const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

// 调试输出
console.log('🔷 handlers.ts - MSW处理程序初始化');
console.log('🔷 handlers.ts - 原始API基础URL:', API_BASE_URL);
console.log('🔷 handlers.ts - 处理后的API基础URL:', baseUrl);
console.log('🔷 handlers.ts - 第一个API路径示例:', `${baseUrl}/research/papers`);

// 强制使用空字符串作为基础URL，让所有API请求都由MSW处理
const finalBaseUrl = '';
console.log('🔷 handlers.ts - 最终使用的API基础URL:', finalBaseUrl);
console.log('🔷 handlers.ts - 注意：所有API路径都将使用finalBaseUrl');

// API处理程序
export const handlers = [
  // 论文搜索API
  http.get(`${finalBaseUrl}/research/papers`, async ({ request }) => {
    // 模拟网络延迟
    await delay(500)
    
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''
    
    console.log('🔍 MSW处理请求:', request.url)
    console.log('🔍 MSW查询参数:', query)
    
    // 根据查询过滤论文
    let filteredPapers = mockPapers
    if (query) {
      filteredPapers = mockPapers.filter(paper => 
        paper.title.toLowerCase().includes(query.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
        paper.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      )
    }
    
    console.log('🔍 MSW返回论文数量:', filteredPapers.length)
    
    return HttpResponse.json({
      papers: filteredPapers,
      total: filteredPapers.length
    })
  }),
  
  // 获取论文详情
  http.get(`${finalBaseUrl}/research/papers/:id`, async ({ params }) => {
    await delay(300)
    
    const { id } = params
    console.log('🔍 MSW处理论文详情请求:', id)
    
    const paper = mockPapers.find(p => p.id === id)
    
    if (!paper) {
      console.log('❌ MSW未找到论文:', id)
      return new HttpResponse(null, { status: 404 })
    }
    
    console.log('✅ MSW返回论文详情:', paper.title)
    return HttpResponse.json(paper)
  }),
  
  // 用户登录
  http.post(`${finalBaseUrl}/auth/login`, async ({ request }) => {
    await delay(500)
    
    const body = await request.json()
    console.log('🔑 MSW处理登录请求:', body.email)
    
    // 简单的模拟登录验证
    if (body.email === 'researcher@example.com' && body.password === 'password123') {
      console.log('✅ MSW登录成功')
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: mockUser
      })
    }
    
    return new HttpResponse(JSON.stringify({ message: '邮箱或密码不正确' }), { 
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }),
  
  // 获取当前用户信息
  http.get(`${finalBaseUrl}/auth/me`, () => {
    console.log('🔍 MSW处理获取用户信息请求')
    return HttpResponse.json(mockUser)
  }),
  
  // 创新点分析API
  http.post(`${finalBaseUrl}/research/innovation/analyze`, async ({ request }) => {
    await delay(1000) // 模拟较长的处理时间
    
    const body = await request.json()
    console.log('🧠 MSW处理创新点分析请求:', body.text ? body.text.substring(0, 50) + '...' : '无文本')
    
    return HttpResponse.json({
      innovation_points: mockInnovationPoints,
      summary: '本文提出了两个主要创新点：改进的注意力机制和轻量级模型架构。这些创新点在提高模型性能和降低计算成本方面具有重要意义。'
    })
  }),
  
  // 文件上传创新点分析API
  http.post(`${finalBaseUrl}/ai/extract-innovations-file`, async ({ request }) => {
    await delay(2000) // 模拟较长的处理时间
    
    console.log('📄 MSW处理文件上传创新点分析请求')
    
    return HttpResponse.json({
      innovation_points: mockInnovationPoints,
      summary: '从上传的PDF文件中提取了两个主要创新点：改进的注意力机制和轻量级模型架构。这些创新点在提高模型性能和降低计算成本方面具有重要意义。'
    })
  })
]