import type { Paper } from '../types/paper';
import axios from 'axios';
import { message } from 'antd';

// API基础URL
const API_BASE_URL = 'http://localhost:8001/api';

// 搜索源接口
interface SearchSource {
  id: string;
  name: string;
  url: string;
  search_mode?: 'fuzzy' | 'exact';
  timeout?: number;
}

// API响应接口
interface SearchResponse {
  papers: Paper[];
}

interface SourcesResponse {
  sources: Array<{
    id: string;
    name: string;
    base_url: string;
    enabled: boolean;
    description: string;
  }>;
  total: number;
}

interface DownloadResponse {
  success: boolean;
  download_url: string;
  filename: string;
  message: string;
}

/**
 * 从多个来源搜索论文
 * @param query 搜索关键词
 * @param sources 搜索源列表
 * @param maxResults 每个源的最大结果数
 * @returns 论文列表
 */
export const searchFromMultipleSources = async (
  query: string,
  sources: SearchSource[],
  maxResults: number = 10
): Promise<Paper[]> => {
  try {
    // 验证输入参数
    if (!query || typeof query !== 'string' || query.trim() === '') {
      message.warning('搜索关键词不能为空');
      return [];
    }

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      message.warning('未选择任何搜索源');
      return [];
    }
    
    // 验证每个source对象是否有必要的属性
    const validSources = sources.filter(source => {
      if (!source || typeof source !== 'object') {
        console.warn('无效的搜索源对象:', source);
        return false;
      }
      if (!source.id || !source.name || !source.url) {
        console.warn('搜索源缺少必要属性:', source);
        return false;
      }
      return true;
    });
    
    if (validSources.length === 0) {
      message.warning('没有有效的搜索源');
      return [];
    }
    
    console.log('🔍 从多个来源搜索论文，关键词:', query, '来源:', validSources);
    
    // 调用后端API进行搜索
    try {
      const response = await axios.post<SearchResponse>(`${API_BASE_URL}/paper-search/search`, {
        query: query.trim(),
        sources: validSources,
        max_results: maxResults,
        search_mode: validSources[0]?.search_mode || 'fuzzy', // 使用第一个源的搜索模式或默认模糊搜索
        timeout: validSources[0]?.timeout || 60 // 使用第一个源的超时时间或默认60秒
      }, {
        timeout: (validSources[0]?.timeout || 60) * 1000, // 转换为毫秒
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 搜索结果:', response.data);
      
      if (response.data && response.data.papers && Array.isArray(response.data.papers)) {
        const papers = response.data.papers;
        message.success(`搜索完成，找到 ${papers.length} 篇论文`);
        return papers;
      } else {
        console.error('API返回的数据格式不正确:', response.data);
        message.error('搜索结果格式不正确');
        return [];
      }
    } catch (apiError: any) {
      console.error('API请求失败:', apiError);
      
      // 检查是否是网络错误或超时
      if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ENOTFOUND') {
        message.error('无法连接到后端服务，使用本地模拟数据');
      } else if (apiError.code === 'ECONNABORTED') {
        message.error('请求超时，使用本地模拟数据');
      } else {
        message.error('搜索请求失败，使用本地模拟数据');
      }
      
      // 使用本地模拟数据作为备选
      console.log('🔍 使用本地模拟数据进行搜索');
      const mockPapers = getMockPapersByKeyword(query, validSources, maxResults);
      return mockPapers;
    }
  } catch (error: any) {
    console.error('搜索论文时发生错误:', error);
    message.error('搜索过程中发生错误');
    return [];
  }
};

/**
 * 获取可用的搜索源列表
 * @returns 搜索源列表
 */
export const getAvailableSources = async (): Promise<SearchSource[]> => {
  try {
    const response = await axios.get<SourcesResponse>(`${API_BASE_URL}/paper-search/sources`, {
      timeout: 10000
    });
    
    if (response.data && response.data.sources && Array.isArray(response.data.sources)) {
      return response.data.sources.map(source => ({
        id: source.id,
        name: source.name,
        url: source.base_url
      }));
    }
    
    return getDefaultSources();
  } catch (error: any) {
    console.error('获取搜索源列表失败:', error);
    message.warning('无法获取搜索源列表，使用默认配置');
    return getDefaultSources();
  }
};

/**
 * 获取默认搜索源
 * @returns 默认搜索源列表
 */
export const getDefaultSources = (): SearchSource[] => {
  return [
    {
      id: 'arxiv',
      name: 'arXiv',
      url: 'https://arxiv.org'
    },
    {
      id: 'ieee',
      name: 'IEEE Xplore',
      url: 'https://ieeexplore.ieee.org'
    },
    {
      id: 'springer',
      name: 'Springer',
      url: 'https://link.springer.com'
    },
    {
      id: 'acm',
      name: 'ACM Digital Library',
      url: 'https://dl.acm.org'
    }
  ];
};

/**
 * 下载论文
 * @param paperId 论文ID
 * @param paperUrl 论文URL
 * @returns 下载信息
 */
export const downloadPaper = async (paperId: string, paperUrl: string): Promise<boolean> => {
  try {
    if (!paperId || !paperUrl) {
      message.error('论文信息不完整，无法下载');
      return false;
    }
    
    console.log('📥 请求下载论文:', paperId);
    
    // 调用后端API获取下载链接
    try {
      const response = await axios.post<DownloadResponse>(`${API_BASE_URL}/paper-search/download`, {
        paper_id: paperId,
        paper_url: paperUrl
      }, {
        timeout: 10000
      });
      
      if (response.data && response.data.success && response.data.download_url) {
        // 在新窗口中打开下载链接
        const link = document.createElement('a');
        link.href = response.data.download_url;
        link.target = '_blank';
        link.download = response.data.filename || `paper_${paperId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success(response.data.message || '论文下载已开始');
        return true;
      } else {
        message.error('无法获取下载链接');
        return false;
      }
    } catch (apiError: any) {
      console.error('下载API请求失败:', apiError);
      
      // 如果API失败，尝试直接打开原始URL
      if (paperUrl) {
        const link = document.createElement('a');
        link.href = paperUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.info('已在新窗口中打开论文链接');
        return true;
      } else {
        message.error('下载失败，无法获取论文链接');
        return false;
      }
    }
  } catch (error: any) {
    console.error('下载论文时发生错误:', error);
    message.error('下载过程中发生错误');
    return false;
  }
};

/**
 * 生成基于关键词和搜索源的模拟论文数据
 * @param query 搜索关键词
 * @param sources 搜索源列表
 * @param maxResults 每个源的最大结果数
 * @returns 模拟论文列表
 */
export const getMockPapersByKeyword = (query: string, sources: SearchSource[], maxResults: number = 10): Paper[] => {
  // 添加防御性编程
  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.error('搜索关键词无效');
    return [];
  }
  
  if (!Array.isArray(sources) || sources.length === 0) {
    console.error('搜索源列表无效或为空');
    return [];
  }
  
  // 验证每个source对象是否有必要的属性
  const validSources = sources.filter(source => {
    if (!source || typeof source !== 'object') {
      console.warn('无效的搜索源对象:', source);
      return false;
    }
    if (!source.id || !source.name || !source.url) {
      console.warn('搜索源缺少必要属性:', source);
      return false;
    }
    return true;
  });
  
  if (validSources.length === 0) {
    console.error('没有有效的搜索源');
    return [];
  }
  
  console.log('🔍 生成模拟论文数据，关键词:', query);
  console.log('🔍 使用的搜索源:', validSources);
  
  const mockPapers: Paper[] = [];
  
  // 为每个搜索源生成模拟数据
  validSources.forEach((source) => {
    // 根据搜索模式和maxResults参数生成论文数量
    let paperCount;
    if (source.search_mode === 'exact') {
      // 精确搜索：生成maxResults的60-80%的论文数量
      const minCount = Math.max(1, Math.floor(maxResults * 0.6));
      const maxCount = Math.max(minCount, Math.floor(maxResults * 0.8));
      paperCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    } else {
      // 模糊搜索：生成maxResults的80-100%的论文数量，获取更多结果
      const minCount = Math.max(1, Math.floor(maxResults * 0.8));
      const maxCount = maxResults;
      paperCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    }
    
    for (let i = 0; i < paperCount; i++) {
      const randomId = Date.now() - Math.floor(Math.random() * 10000);
      const randomYear = new Date().getFullYear() - Math.floor(Math.random() * 5); // 最近5年内
      const randomCitations = Math.floor(Math.random() * 200); // 0到199之间的随机引用次数
      
      // 根据搜索模式生成不同类型的标题
      let title = '';
      if (source.search_mode === 'exact') {
        // 精确搜索：生成更精确匹配的标题
        if (i % 3 === 0) {
          title = `${query}: A Comprehensive Study`;
        } else if (i % 3 === 1) {
          title = `Advanced ${query} Techniques in ${source.name}`;
        } else {
          title = `${query} Applications and Future Directions`;
        }
      } else {
        // 模糊搜索：生成更多样化的相关标题
        const titleVariations = [
          `${query}的研究进展与应用`,
          `${source.name}领域中${query}的实验分析`,
          `基于${query}的${source.name}创新方法`,
          `${query}技术在${source.name}中的应用研究`,
          `面向${query}的${source.name}系统设计`,
          `${query}相关技术综述`,
          `${source.name}环境下的${query}优化策略`,
          `${query}驱动的${source.name}解决方案`
        ];
        title = titleVariations[i % titleVariations.length];
      }
      
      // 生成不同的作者组合
      const authorSets = [
        [`${source.name}研究员 A`, `${source.name}研究员 B`],
        [`${source.name}学者 C`, `${source.name}学者 D`, `国际合作者 E`],
        [`研究团队 F`, `合作学者 G`],
        [`${source.name}实验室`, `联合研究组`]
      ];
      
      // 根据搜索模式生成不同的摘要
      let abstract = '';
      if (source.search_mode === 'exact') {
        // 精确搜索：生成更精确的摘要
        abstract = `本研究专注于${query}的核心技术和方法。通过严格的实验设计和数据分析，我们验证了${query}在${source.name}领域的有效性和可行性。`;
      } else {
        // 模糊搜索：生成更多样化的摘要
        const abstractVariations = [
          `本研究探讨了${query}在${source.name}领域的应用和最新进展。通过系统分析和实验验证，我们提出了新的理论框架。`,
          `本文综述了近年来${source.name}领域关于${query}的研究现状，并对未来发展趋势进行了展望。`,
          `我们提出了一种基于${query}的创新方法，用于解决${source.name}领域中的关键问题，实验结果表明该方法具有显著优势。`,
          `通过对${query}相关技术的深入研究，本文提出了一套完整的${source.name}解决方案，为该领域的发展提供了新的思路。`,
          `本研究从${query}的角度出发，分析了${source.name}领域面临的挑战和机遇，提出了相应的对策和建议。`
        ];
        abstract = abstractVariations[i % abstractVariations.length];
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
      
      // 创建论文对象
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
        isFavorite: false
      };
      
      mockPapers.push(paper);
    }
  });
  
  // 按年份和引用次数排序
  mockPapers.sort((a, b) => {
    const yearDiff = (b.year || 0) - (a.year || 0);
    if (yearDiff !== 0) return yearDiff;
    return (b.citations || 0) - (a.citations || 0);
  });
  
  console.log('🔍 生成的模拟论文数据:', mockPapers);
  return mockPapers;
};

/**
 * 从arXiv搜索论文（保留向后兼容性）
 * @param query 搜索关键词
 * @returns 论文列表
 */
export const searchArxiv = async (query: string): Promise<Paper[]> => {
  const arxivSource: SearchSource = {
    id: 'arxiv',
    name: 'arXiv',
    url: 'https://arxiv.org'
  };
  
  return searchFromMultipleSources(query, [arxivSource]);
};

/**
 * 从自定义源搜索论文（保留向后兼容性）
 * @param query 搜索关键词
 * @param sourceUrl 搜索源URL
 * @param sourceName 搜索源名称
 * @returns 论文列表
 */
export const searchCustomSource = async (query: string, sourceUrl: string, sourceName: string): Promise<Paper[]> => {
  const customSource: SearchSource = {
    id: sourceName.toLowerCase().replace(/\s+/g, '-'),
    name: sourceName,
    url: sourceUrl
  };
  
  return searchFromMultipleSources(query, [customSource]);
};