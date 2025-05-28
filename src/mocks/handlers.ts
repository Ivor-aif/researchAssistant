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
let MOCK_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
// 移除基础URL中可能的尾部斜杠
MOCK_API_BASE_URL = MOCK_API_BASE_URL.endsWith('/') ? MOCK_API_BASE_URL.slice(0, -1) : MOCK_API_BASE_URL;

// 如果MOCK_API_BASE_URL以'/api'结尾，则移除它，因为API客户端中的路径已经包含了'/api'
const baseUrl = MOCK_API_BASE_URL.endsWith('/api') ? MOCK_API_BASE_URL.slice(0, -4) : MOCK_API_BASE_URL;

// 调试输出
console.log('🔷 handlers.ts - MSW处理程序初始化');
console.log('🔷 handlers.ts - 原始API基础URL:', MOCK_API_BASE_URL);
console.log('🔷 handlers.ts - 处理后的API基础URL:', baseUrl);
console.log('🔷 handlers.ts - 第一个API路径示例:', `${baseUrl}/research/papers`);

// 强制使用空字符串作为基础URL，让所有API请求都由MSW处理
const finalBaseUrl = '';
// 确保API路径正确匹配
console.log('🔧 handlers.ts - 配置API基础URL:', MOCK_API_BASE_URL);
console.log('🔧 handlers.ts - 最终使用的API基础URL:', finalBaseUrl);

// 模拟研究进度数据
const mockProjects = [
  {
    id: 'project1',
    title: '人工智能在学术研究中的应用',
    description: '研究人工智能如何辅助学术研究和文献分析',
    start_date: '2023-01-15',
    status: 'IN_PROGRESS'
  },
  {
    id: 'project2',
    title: '自然语言处理技术评估',
    description: '评估最新的NLP技术在学术文本分析中的表现',
    start_date: '2023-03-10',
    status: 'COMPLETED'
  },
  {
    id: 'project3',
    title: '跨学科研究方法探索',
    description: '探索AI与其他学科结合的研究方法论',
    start_date: '2023-05-22',
    status: 'PLANNING'
  }
];

// 模拟报告数据
const mockReportSections = [
  {
    title: '研究背景',
    content: '本研究旨在探索人工智能技术在学术研究中的应用前景和实际效果。随着AI技术的快速发展，其在辅助学术研究方面展现出巨大潜力。'
  },
  {
    title: '研究方法',
    content: '本研究采用混合研究方法，结合文献分析、实验研究和案例研究，全面评估AI技术在学术研究各环节的应用效果。'
  },
  {
    title: '研究结果',
    content: '研究表明，AI技术能显著提高文献检索效率，平均节省研究者40%的文献筛选时间。同时，AI辅助的文本分析能够发现传统方法容易忽略的研究关联。'
  },
  {
    title: '结论与建议',
    content: '本研究证实了AI技术在学术研究中的价值，建议研究机构加强AI工具的开发和应用，并为研究人员提供相关培训。'
  }
];

// 导出所有处理程序
export const handlers = [
  // 论文搜索API
  http.get(`${finalBaseUrl}/research/papers`, async ({ request }) => {
    console.log('📥 MSW - 拦截到论文搜索请求:', request.url);
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    console.log('📥 MSW - 搜索关键词:', query);
    
    // 延迟500ms模拟网络请求
    await delay(500);
    
    // 根据查询参数过滤论文
    const filteredPapers = mockPapers.filter(paper => 
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
      paper.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
    );
    
    console.log('📤 MSW - 返回论文搜索结果:', filteredPapers.length, '条记录');
    return HttpResponse.json({
      papers: filteredPapers,
      total: filteredPapers.length
    });
  }),
  
  // arXiv论文搜索API
  http.get(`${finalBaseUrl}/research/papers/arxiv`, async ({ request }) => {
    console.log('📥 MSW - 拦截到arXiv论文搜索请求:', request.url);
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    console.log('📥 MSW - arXiv搜索关键词:', query);
    
    // 延迟800ms模拟网络请求
    await delay(800);
    
    // 根据查询参数过滤arXiv论文
    const filteredPapers = mockPapers
      .filter(paper => paper.source === 'arXiv')
      .filter(paper => 
        paper.title.toLowerCase().includes(query.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
        paper.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      );
    
    console.log('📤 MSW - 返回arXiv论文搜索结果:', filteredPapers.length, '条记录');
    return HttpResponse.json({
      papers: filteredPapers,
      total: filteredPapers.length
    });
  }),
  
  // 自定义源论文搜索API
  http.get(`${finalBaseUrl}/research/papers/custom`, async ({ request }) => {
    console.log('📥 MSW - 拦截到自定义源论文搜索请求:', request.url);
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const source = url.searchParams.get('source') || '';
    console.log('📥 MSW - 自定义源搜索关键词:', query, '源:', source);
    
    // 延迟600ms模拟网络请求
    await delay(600);
    
    // 根据查询参数和源过滤论文
    const filteredPapers = mockPapers
      .filter(paper => paper.source === source)
      .filter(paper => 
        paper.title.toLowerCase().includes(query.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
        paper.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      );
    
    console.log('📤 MSW - 返回自定义源论文搜索结果:', filteredPapers.length, '条记录');
    return HttpResponse.json({
      papers: filteredPapers,
      total: filteredPapers.length
    });
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
  }),

  // 添加arXiv搜索API处理程序
  http.get(`${finalBaseUrl}/research/papers/arxiv`, async ({ request }) => {
    // 模拟网络延迟
    await delay(800)
    
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''
    
    console.log('🔍 MSW处理arXiv搜索请求:', query)
    
    // 根据查询过滤论文，只返回arXiv来源的论文
    let filteredPapers = mockPapers.filter(paper => paper.source === 'arXiv')
    if (query) {
      filteredPapers = filteredPapers.filter(paper => 
        paper.title.toLowerCase().includes(query.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
        paper.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      )
    }
    
    console.log('🔍 MSW返回arXiv论文数量:', filteredPapers.length)
    
    return HttpResponse.json({
      papers: filteredPapers,
      total: filteredPapers.length
    })
  }),
  
  // 添加自定义源搜索API处理程序
  http.get(`${finalBaseUrl}/research/papers/custom`, async ({ request }) => {
    // 模拟网络延迟
    await delay(600)
    
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''
    const source = url.searchParams.get('source') || ''
    
    console.log('🔍 MSW处理自定义源搜索请求:', query, '源:', source)
    
    // 根据查询和源过滤论文
    let filteredPapers = mockPapers
    if (source) {
      filteredPapers = mockPapers.filter(paper => 
        paper.source.toLowerCase() === source.toLowerCase()
      )
    }
    
    if (query) {
      filteredPapers = filteredPapers.filter(paper => 
        paper.title.toLowerCase().includes(query.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
        paper.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      )
    }
    
    console.log('🔍 MSW返回自定义源论文数量:', filteredPapers.length)
    
    return HttpResponse.json({
      papers: filteredPapers,
      total: filteredPapers.length
    })
  }),
  
  // 研究进度API - 获取项目列表
  http.get(`${finalBaseUrl}/research/progress`, async () => {
    console.log('📥 MSW - 拦截到获取研究进度项目列表请求');
    
    // 延迟400ms模拟网络请求
    await delay(400);
    
    console.log('📤 MSW - 返回研究进度项目列表:', mockProjects.length, '个项目');
    return HttpResponse.json({
      data: mockProjects,
      total: mockProjects.length
    });
  }),
  
  // 研究进度API - 创建项目
  http.post(`${finalBaseUrl}/research/progress`, async ({ request }) => {
    console.log('📥 MSW - 拦截到创建研究进度项目请求');
    
    try {
      const body = await request.json();
      console.log('📥 MSW - 创建项目数据:', body);
      
      // 延迟600ms模拟网络请求
      await delay(600);
      
      // 创建新项目
      const newProject = {
        id: `project${Date.now()}`,
        title: body.title || '新研究项目',
        description: body.description || '项目描述',
        start_date: body.start_date || new Date().toISOString().split('T')[0],
        status: body.status || 'PLANNING'
      };
      
      // 在实际应用中，这里会将新项目添加到数据库
      // 在模拟环境中，我们只返回新创建的项目
      
      console.log('📤 MSW - 返回新创建的项目:', newProject);
      return HttpResponse.json({
        data: newProject,
        message: '项目创建成功'
      });
    } catch (error) {
      console.error('❌ MSW - 创建项目失败:', error);
      return new HttpResponse(JSON.stringify({ message: '创建项目失败，请检查输入数据' }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }),
  
  // 报告API - 生成报告
  http.post(`${finalBaseUrl}/research/reports/generate`, async ({ request }) => {
    console.log('📥 MSW - 拦截到生成报告请求');
    
    try {
      const body = await request.json();
      console.log('📥 MSW - 生成报告数据:', body);
      
      // 延迟1200ms模拟报告生成过程
      await delay(1200);
      
      console.log('📤 MSW - 返回生成的报告内容');
      return HttpResponse.json({
        data: {
          title: body.title || '研究报告',
          type: body.type || 'research',
          sections: mockReportSections
        },
        message: '报告生成成功'
      });
    } catch (error) {
      console.error('❌ MSW - 生成报告失败:', error);
      return new HttpResponse(JSON.stringify({ message: '生成报告失败，请检查输入数据' }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }),
  
  // 报告API - 下载报告
  http.post(`${finalBaseUrl}/research/reports/download`, async ({ request }) => {
    console.log('📥 MSW - 拦截到下载报告请求');
    
    try {
      const body = await request.json();
      console.log('📥 MSW - 下载报告数据:', body);
      
      // 延迟800ms模拟下载准备过程
      await delay(800);
      
      // 生成模拟下载链接
      const downloadUrl = `${finalBaseUrl}/downloads/${body.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      
      console.log('📤 MSW - 返回报告下载链接:', downloadUrl);
      return HttpResponse.json({
        data: {
          download_url: downloadUrl
        },
        message: '报告下载链接生成成功'
      });
    } catch (error) {
      console.error('❌ MSW - 下载报告失败:', error);
      return new HttpResponse(JSON.stringify({ message: '下载报告失败，请检查输入数据' }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  })
]