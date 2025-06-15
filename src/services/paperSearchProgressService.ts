import type { Paper } from '../types/paper';

export interface SearchProgress {
  type: 'progress' | 'complete' | 'error' | 'heartbeat';
  message?: string;
  current?: number;
  total?: number;
  papers_found?: number;
  percentage?: number;
  papers?: Paper[];
  total_found?: number;
  // 为 SearchProgressComponent 添加的属性
  source: string;
  progress: number;
  status: 'searching' | 'completed' | 'failed' | 'cancelled';
}

export interface SearchProgressCallbacks {
  onProgress?: (progress: SearchProgress) => void;
  onComplete?: (papers: Paper[]) => void;
  onError?: (error: string) => void;
}

export class PaperSearchProgressService {
  private eventSource: EventSource | null = null;
  private abortController: AbortController | null = null;

  /**
   * 开始带进度反馈的论文搜索
   */
  async searchWithProgress(
    query: string,
    sources: Array<{ id: string; name: string }>,
    maxResults: number = 10,
    callbacks: SearchProgressCallbacks = {}
  ): Promise<void> {
    // 停止之前的搜索
    this.stopSearch();

    try {
      // 验证输入
      if (!query?.trim()) {
        throw new Error('搜索关键词不能为空');
      }

      if (!sources?.length) {
        throw new Error('请选择至少一个搜索源');
      }

      // 创建AbortController用于取消请求
      this.abortController = new AbortController();

      // 准备请求数据
      const requestData = {
        query: query.trim(),
        sources,
        max_results: Math.max(1, maxResults)
      };
      
      console.log('🔍 进度搜索请求数据:', requestData);
      console.log('🔍 每个源最大结果数:', requestData.max_results);

      // 发送POST请求启动搜索
      const response = await fetch('/api/paper-search/search-with-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`搜索请求失败: ${response.status} ${errorText}`);
      }

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/plain')) {
        throw new Error('服务器返回了意外的响应类型');
      }

      // 创建读取器来处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          // 解码数据并添加到缓冲区
          buffer += decoder.decode(value, { stream: true });

          // 处理缓冲区中的完整消息
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一个不完整的行

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // 移除 'data: ' 前缀
                if (jsonStr.trim()) {
                  const progressData: SearchProgress = JSON.parse(jsonStr);
                  this.handleProgressData(progressData, callbacks);
                }
              } catch (parseError) {
                console.warn('解析进度数据失败:', parseError, 'Line:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('搜索已被取消');
          return;
        }
        
        console.error('搜索过程中发生错误:', error);
        callbacks.onError?.(error.message);
      } else {
        console.error('未知错误:', error);
        callbacks.onError?.('搜索过程中发生未知错误');
      }
    } finally {
      this.cleanup();
    }
  }

  /**
   * 处理进度数据
   */
  private handleProgressData(data: SearchProgress, callbacks: SearchProgressCallbacks) {
    switch (data.type) {
      case 'progress':
        callbacks.onProgress?.(data);
        break;
        
      case 'complete':
        if (data.papers) {
          callbacks.onComplete?.(data.papers);
        }
        callbacks.onProgress?.(data);
        break;
        
      case 'error':
        callbacks.onError?.(data.message || '搜索过程中发生错误');
        break;
        
      case 'heartbeat':
        // 心跳消息，保持连接活跃
        break;
        
      default:
        console.warn('未知的进度数据类型:', data);
    }
  }

  /**
   * 停止当前搜索
   */
  stopSearch(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.cleanup();
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.abortController = null;
  }

  /**
   * 获取搜索源状态
   */
  async getSourcesWithStatus(): Promise<{
    sources: Array<{
      id: string;
      name: string;
      base_url: string;
      enabled: boolean;
      description: string;
      status: string;
    }>;
    total: number;
    enabled_count: number;
  }> {
    try {
      const response = await fetch('/api/paper-search/sources-with-status');
      
      if (!response.ok) {
        throw new Error(`获取搜索源状态失败: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取搜索源状态失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const paperSearchProgressService = new PaperSearchProgressService();