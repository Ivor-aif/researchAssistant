// 论文相关类型定义

/**
 * 论文接口定义
 */
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  year: number;
  journal: string;
  citations: number;
  source?: string; // 论文来源
  url?: string; // 论文链接
  isFavorite?: boolean; // 是否已收藏
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