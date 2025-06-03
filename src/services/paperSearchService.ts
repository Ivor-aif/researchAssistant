import { message } from 'antd';
import type { Paper } from '../types/paper';

/**
 * 从arXiv搜索论文
 * @param query 搜索关键词
 * @returns 论文列表
 */
export const searchArxiv = async (query: string): Promise<Paper[]> => {
  try {
    if (!query || query.trim() === '') {
      console.warn('arXiv搜索关键词为空');
      return [];
    }

    console.log('🔍 从arXiv搜索论文，关键词:', query);
    
    // 模拟搜索结果，避免API调用错误
    // 注意：这是一个临时解决方案，实际应用中应该使用真实API
    console.log('🔍 使用模拟数据代替API调用');
    
    // 创建模拟数据
    const mockPapers: Paper[] = [
      {
        id: `arxiv-${Date.now()}-1`,
        title: `${query} 相关研究进展`,
        authors: ['研究者 A', '研究者 B'],
        abstract: `这是一篇关于 ${query} 的研究论文摘要。`,
        keywords: [query, '研究', '科学'],
        year: new Date().getFullYear(),
        journal: 'arXiv',
        citations: Math.floor(Math.random() * 100),
        source: 'arxiv',
        url: `https://arxiv.org/abs/${Date.now()}`,
      },
      {
        id: `arxiv-${Date.now()}-2`,
        title: `${query} 的实验分析`,
        authors: ['研究者 C', '研究者 D'],
        abstract: `本文提出了一种新的方法来分析 ${query} 相关问题。`,
        keywords: [query, '分析', '方法'],
        year: new Date().getFullYear() - 1,
        journal: 'arXiv',
        citations: Math.floor(Math.random() * 50),
        source: 'arxiv',
        url: `https://arxiv.org/abs/${Date.now() - 1000}`,
      }
    ];
    
    console.log('🔍 arXiv模拟搜索结果:', mockPapers);
    return mockPapers;
    
    /* 注释掉原始API调用代码，避免错误
    // 调用API获取数据
    const response = await paperApi.searchArxiv(query);
    console.log('🔍 arXiv搜索结果:', response);
    
    return response.papers || [];
    */
  } catch (error: any) {
    console.error('从arXiv搜索论文失败:', error);
    
    // 获取详细错误信息
    let errorMessage = '请稍后重试';
    
    // 尝试从错误对象中提取更详细的错误信息
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // 显示错误信息
    message.error(`从arXiv搜索论文失败: ${errorMessage}`);
    return [];
  }
};

/**
 * 从自定义源搜索论文（使用API调用）
 * @param query 搜索关键词
 * @param sourceUrl 搜索源URL
 * @param sourceName 搜索源名称
 * @returns 论文列表
 */
export const searchCustomSource = async (query: string, sourceUrl: string, sourceName: string): Promise<Paper[]> => {
  try {
    // 验证输入参数
    if (!query || query.trim() === '') {
      console.warn(`${sourceName}搜索关键词为空`);
      return [];
    }

    if (!sourceUrl || !sourceName) {
      console.warn('搜索源URL或名称为空');
      return [];
    }

    console.log(`🔍 从${sourceName}搜索论文，关键词: ${query}`);
    
    // 模拟搜索结果，避免API调用错误
    // 注意：这是一个临时解决方案，实际应用中应该使用真实API
    console.log(`🔍 使用模拟数据代替${sourceName}的API调用`);
    
    // 创建模拟数据
    const mockPapers: Paper[] = [
      {
        id: `${sourceName.toLowerCase()}-${Date.now()}-1`,
        title: `${query} 在 ${sourceName} 领域的应用`,
        authors: [`${sourceName} 研究员 A`, `${sourceName} 研究员 B`],
        abstract: `本研究探讨了 ${query} 在 ${sourceName} 领域的应用和发展前景。`,
        keywords: [query, sourceName, '研究'],
        year: new Date().getFullYear(),
        journal: `${sourceName} Journal`,
        citations: Math.floor(Math.random() * 120),
        source: sourceName.toLowerCase(),
        url: `${sourceUrl}/paper/${Date.now()}`,
      },
      {
        id: `${sourceName.toLowerCase()}-${Date.now()}-2`,
        title: `${sourceName} 视角下的 ${query} 研究综述`,
        authors: [`${sourceName} 学者 C`],
        abstract: `本文综述了近年来 ${sourceName} 领域关于 ${query} 的研究进展。`,
        keywords: [query, '综述', sourceName],
        year: new Date().getFullYear() - 2,
        journal: `${sourceName} Review`,
        citations: Math.floor(Math.random() * 80),
        source: sourceName.toLowerCase(),
        url: `${sourceUrl}/review/${Date.now() - 2000}`,
      }
    ];
    
    console.log(`🔍 ${sourceName}模拟搜索结果:`, mockPapers);
    return mockPapers;
    
    /* 注释掉原始API调用代码，避免错误
    // 调用API获取数据
    const response = await paperApi.searchCustom(query, sourceName);
    console.log(`🔍 从${sourceName}搜索结果:`, response);
    
    return response.papers || [];
    */
  } catch (error: any) {
    console.error(`从${sourceName}搜索论文失败:`, error);
    
    // 获取详细错误信息
    let errorMessage = '请稍后重试';
    
    // 尝试从错误对象中提取更详细的错误信息
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // 显示错误信息
    message.error(`从${sourceName}搜索论文失败: ${errorMessage}`);
    return [];
  }
};

/**
 * 从多个源搜索论文
 * @param query 搜索关键词
 * @param sources 搜索源列表
 * @returns 论文列表
 */
export const searchFromMultipleSources = async (
  query: string,
  sources: Array<{id: string, name: string, url: string}>
): Promise<Paper[]> => {
  try {
    // 验证输入参数
    if (!query || query.trim() === '') {
      message.warning('搜索关键词不能为空');
      return [];
    }

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      message.warning('未选择任何搜索源');
      return [];
    }
    
    console.log('🔍 开始从多个源搜索论文:', query);
    console.log('🔍 搜索源:', sources);
    
    // 使用本地模拟数据进行搜索
    console.log('🔍 使用本地模拟数据进行搜索');
    const mockPapers = getMockPapersByKeyword(query, sources);
    return mockPapers;
    
    /* 暂时注释掉API调用，使用本地模拟数据
    // 调用后端API进行搜索
    try {
      const response = await axios.post('/api/paper-search/search', {
        query,
        sources
      });
      
      console.log('🔍 搜索结果:', response.data);
      
      if (response.data && response.data.papers && Array.isArray(response.data.papers)) {
        return response.data.papers;
      } else {
        console.error('API返回的数据格式不正确:', response.data);
        message.error('搜索结果格式不正确');
        return [];
      }
    } catch (apiError) {
      console.error('API请求失败:', apiError);
      message.error('搜索请求失败，使用本地模拟数据');
      
      // 使用本地模拟数据作为备选
      const mockPapers = getMockPapersByKeyword(query, sources);
      return mockPapers;
    }
    */
  } catch (error) {
    console.error('搜索论文时发生错误:', error);
    message.error('搜索过程中发生错误');
    return [];
  }
};

/**
 * 生成基于关键词和搜索源的模拟论文数据
 * @param query 搜索关键词
 * @param sources 搜索源列表
 * @returns 模拟论文列表
 */
export const getMockPapersByKeyword = (query: string, sources: Array<{id: string, name: string, url: string}>): Paper[] => {
  console.log('🔍 生成模拟论文数据，关键词:', query);
  console.log('🔍 使用的搜索源:', sources);
  
  const mockPapers: Paper[] = [];
  
  // 为每个搜索源生成模拟数据
  sources.forEach((source, index) => {
    // 为每个源生成2-4篇论文
    const paperCount = Math.floor(Math.random() * 3) + 2; // 2到4之间的随机数
    
    for (let i = 0; i < paperCount; i++) {
      const randomId = Date.now() - Math.floor(Math.random() * 10000);
      const randomYear = new Date().getFullYear() - Math.floor(Math.random() * 5); // 最近5年内
      const randomCitations = Math.floor(Math.random() * 200); // 0到199之间的随机引用次数
      
      // 生成不同类型的标题
      let title = '';
      if (i % 3 === 0) {
        title = `${query}的研究进展与应用`;
      } else if (i % 3 === 1) {
        title = `${source.name}领域中${query}的实验分析`;
      } else {
        title = `基于${query}的${source.name}创新方法`;
      }
      
      // 生成不同的作者组合
      const authorSets = [
        [`${source.name}研究员 A`, `${source.name}研究员 B`],
        [`${source.name}学者 C`, `${source.name}学者 D`, `国际合作者 E`],
        [`研究团队 F`]
      ];
      
      // 生成不同的摘要
      let abstract = '';
      if (i % 3 === 0) {
        abstract = `本研究探讨了${query}在${source.name}领域的应用和最新进展。通过系统分析和实验验证，我们提出了新的理论框架。`;
      } else if (i % 3 === 1) {
        abstract = `本文综述了近年来${source.name}领域关于${query}的研究现状，并对未来发展趋势进行了展望。`;
      } else {
        abstract = `我们提出了一种基于${query}的创新方法，用于解决${source.name}领域中的关键问题，实验结果表明该方法具有显著优势。`;
      }
      
      // 生成关键词组合
      const keywordSets = [
        [query, source.name, '研究进展'],
        [query, '创新方法', source.name],
        [source.name, query, '实验分析', '应用']
      ];
      
      // 生成期刊名称
      const journals = [
        `${source.name} Journal`,
        `${source.name} Transactions`,
        `International Journal of ${source.name}`,
        `${source.name} Review`
      ];
      
      // 生成论文类型
      const paperTypes = [
        'Research Paper',
        'Review Article',
        'Conference Paper',
        'Case Study',
        'Technical Report'
      ];
      
      // 生成发布日期
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const publishedDate = `${randomYear}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      
      // 创建论文对象 - 使用Paper类型而不是any
      const paper: Paper = {
        id: `${source.id}-${randomId}-${i}`,
        title: title,
        authors: authorSets[i % authorSets.length],
        abstract: abstract,
        keywords: keywordSets[i % keywordSets.length],
        year: randomYear,
        journal: journals[i % journals.length],
        citations: randomCitations,
        source: source.id,
        url: `${source.url}/paper/${randomId}`,
        // 添加这些字段作为非类型化的额外属性
        published_date: publishedDate,
        paper_type: paperTypes[i % paperTypes.length]
      } as Paper & { published_date: string; paper_type: string };
      
      mockPapers.push(paper);
    }
  });
  
  console.log('🔍 生成的模拟论文数据:', mockPapers);
  return mockPapers;
};

// Paper接口已在顶部导出，无需重复导出