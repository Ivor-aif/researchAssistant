import type { Paper } from './paper';

/**
 * 收藏夹接口定义
 */
export interface FavoriteFolder {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
  papers: Paper[];
}

/**
 * 创建收藏夹参数
 */
export interface CreateFolderParams {
  name: string;
  description?: string;
}

/**
 * 更新收藏夹参数
 */
export interface UpdateFolderParams {
  id: string;
  name?: string;
  description?: string;
}

/**
 * 移动论文参数
 */
export interface MovePaperParams {
  paperId: string;
  fromFolderId: string;
  toFolderId: string;
}

/**
 * 收藏夹统计信息
 */
export interface FolderStats {
  totalFolders: number;
  totalPapers: number;
  defaultFolderPapers: number;
}