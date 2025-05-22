import axios from 'axios';
import { message } from 'antd';
import type { Paper } from '../types/paper';


/**
 * 从arXiv搜索论文
 * @param query 搜索关键词
 * @returns 论文列表
 */
export const searchArxiv = async (query: string): Promise<Paper[]> => {
  try {
    // arXiv API URL
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10`;
    
    const response = await axios.get<string>(url);
    
    // 将XML响应转换为JSON
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, 'text/xml');
    
    // 提取论文信息
    const entries = Array.from(xmlDoc.getElementsByTagName('entry'));
    
    return entries.map(entry => {
      // 提取作者
      const authorElements = entry.getElementsByTagName('author');
      const authors = Array.from(authorElements).map(author => {
        const nameElement = author.getElementsByTagName('name')[0];
        return nameElement ? nameElement.textContent || '' : '';
      }).filter(name => name !== '');
      
      // 提取分类作为关键词
      const categoryElements = entry.getElementsByTagName('category');
      const keywords = Array.from(categoryElements)
        .map(category => category.getAttribute('term') || '')
        .filter(term => term !== '');
      
      // 提取发布日期并获取年份
      const publishedElement = entry.getElementsByTagName('published')[0];
      const publishedDate = publishedElement ? new Date(publishedElement.textContent || '') : new Date();
      const year = publishedDate.getFullYear();
      
      // 提取ID并清理
      const idElement = entry.getElementsByTagName('id')[0];
      const fullId = idElement ? idElement.textContent || '' : '';
      const id = fullId.split('/').pop() || fullId;
      
      // 构建arXiv论文URL
      const arxivUrl = `https://arxiv.org/abs/${id}`;
      
      return {
        id,
        title: entry.getElementsByTagName('title')[0]?.textContent || '无标题',
        authors,
        abstract: entry.getElementsByTagName('summary')[0]?.textContent || '无摘要',
        keywords: keywords.length > 0 ? keywords : ['arXiv'],
        year,
        journal: 'arXiv',
        citations: 0, // arXiv API不提供引用次数
        source: 'arXiv',
        url: arxivUrl,
        isFavorite: false
      };
    });
  } catch (error) {
    console.error('从arXiv搜索论文失败:', error);
    message.error('从arXiv搜索论文失败，请稍后重试');
    return [];
  }
};

/**
 * 从自定义源搜索论文（模拟实现，实际项目中需要根据具体API调整）
 * @param query 搜索关键词
 * @param sourceUrl 搜索源URL
 * @param sourceName 搜索源名称
 * @returns 论文列表
 */
export const searchCustomSource = async (query: string, sourceUrl: string, sourceName: string): Promise<Paper[]> => {
  try {
    // 注意：这里是模拟实现，实际项目中需要根据具体API调整
    // 由于大多数学术网站需要特定的API访问方式，这里仅作为示例
    
    // 模拟数据
    const mockPapers: Paper[] = [
      {
        id: `${sourceName.toLowerCase()}_${Date.now()}`,
        title: `${query}相关研究进展`,
        authors: ['研究者A', '研究者B'],
        abstract: `这是一篇关于${query}的研究论文，来自${sourceName}...`,
        keywords: [query, '研究', '进展'],
        year: new Date().getFullYear(),
        journal: sourceName,
        citations: Math.floor(Math.random() * 100),
        source: sourceName,
        url: sourceUrl + '?q=' + encodeURIComponent(query), // 构建搜索URL
        isFavorite: false
      }
    ];
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockPapers;
  } catch (error) {
    console.error(`从${sourceName}搜索论文失败:`, error);
    message.error(`从${sourceName}搜索论文失败，请稍后重试`);
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
    if (sources.length === 0) {
      message.warning('未选择任何搜索源');
      return [];
    }
    
    // 并行从所有源搜索
    const searchPromises = sources.map(source => {
      if (source.id === 'arxiv') {
        return searchArxiv(query);
      } else {
        return searchCustomSource(query, source.url, source.name);
      }
    });
    
    const resultsArray = await Promise.all(searchPromises);
    
    // 合并结果
    const allPapers = resultsArray.flat();
    
    return allPapers;
  } catch (error) {
    console.error('多源搜索失败:', error);
    message.error('论文检索失败，请稍后重试');
    return [];
  }
};

// Paper接口已在顶部导出，无需重复导出