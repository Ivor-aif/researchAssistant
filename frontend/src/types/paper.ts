// 论文类型定义

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