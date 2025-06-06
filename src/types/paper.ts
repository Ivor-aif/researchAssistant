// 论文相关类型定义

/**
 * 论文接口定义
 */
export interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  abstract?: string;
  keywords?: string[];
  year?: number;
  journal?: string;
  citations?: number;
  source?: string; // 论文来源
  url?: string; // 论文链接
  isFavorite?: boolean; // 是否已收藏
}

/**
 * 论文搜索参数接口
 */
export interface PaperSearchParams {
  query?: string; // 搜索关键词
  source?: string; // 论文来源
  year?: number; // 发表年份
  author?: string; // 作者
  sortBy?: 'relevance' | 'year' | 'citations'; // 排序方式
  limit?: number; // 返回结果数量限制
  offset?: number; // 分页偏移量
}

/**
 * 创新点接口定义
 */
export interface InnovationPoint {
  id: string;
  title: string;
  description: string;
  significance: string;
  relevance: number;
  technical_feasibility: number;
  implementation_difficulty: string;
  novelty_score: number;
}

/**
 * arXiv API 响应接口
 */
export interface ArxivResponse {
  feed: {
    entry: Array<{
      id: string;
      title: string;
      author: Array<{ name: string }>;
      summary: string;
      published: string;
      category?: Array<{ term: string }>;
    }>;
  };
}