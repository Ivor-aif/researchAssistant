import axios from 'axios';
import { message } from 'antd';
import type { Paper } from '../types/paper';
import { paperApi } from '../api';


/**
 * 从arXiv搜索论文
 * @param query 搜索关键词
 * @returns 论文列表
 */
export const searchArxiv = async (query: string): Promise<Paper[]> => {
  try {
    console.log('🔍 从arXiv搜索论文，关键词:', query);
    
    // 调用API获取数据
    const response = await paperApi.searchArxiv(query);
    console.log('🔍 arXiv搜索结果:', response);
    
    return response.papers || [];
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
    console.log(`🔍 从${sourceName}搜索论文，关键词: ${query}`);
    
    // 调用API获取数据
    const response = await paperApi.searchCustom(query, sourceName);
    console.log(`🔍 从${sourceName}搜索结果:`, response);
    
    return response.papers || [];
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
    if (sources.length === 0) {
      message.warning('未选择任何搜索源');
      return [];
    }
    
    console.log('🔍 开始从多个源搜索论文:', query);
    console.log('🔍 搜索源:', sources);
    
    // 并行从所有源搜索
    const searchPromises = sources.map(source => {
      if (source.id === 'arxiv') {
        console.log('🔍 调用 arXiv 搜索');
        return searchArxiv(query);
      } else {
        console.log('🔍 调用自定义源搜索:', source.name);
        return searchCustomSource(query, source.url, source.name);
      }
    });
    
    console.log('🔍 等待所有搜索完成...');
    const resultsArray = await Promise.all(searchPromises);
    
    // 合并结果
    const allPapers = resultsArray.flat();
    console.log('🔍 搜索完成，总共找到论文数量:', allPapers.length);
    
    return allPapers;
  } catch (error: any) {
    console.error('多源搜索失败:', error);
    
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
    message.error(`论文检索失败: ${errorMessage}`);
    return [];
  }
};

// Paper接口已在顶部导出，无需重复导出