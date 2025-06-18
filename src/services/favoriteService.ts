import type { Paper } from '../types/paper';
import type { FavoriteFolder, CreateFolderParams, UpdateFolderParams, MovePaperParams, FolderStats } from '../types/favorite';
import { message } from 'antd';

// 本地存储键名
const FAVORITE_PAPERS_KEY = 'favorite_papers'; // 保留兼容性
const FAVORITE_FOLDERS_KEY = 'favorite_folders';
const DEFAULT_FOLDER_ID = 'default';
const DEFAULT_FOLDER_NAME = '默认收藏夹';

/**
 * 初始化默认收藏夹
 */
const initializeDefaultFolder = (): FavoriteFolder => {
  const now = Date.now();
  return {
    id: DEFAULT_FOLDER_ID,
    name: DEFAULT_FOLDER_NAME,
    description: '系统默认收藏夹',
    createdAt: now,
    updatedAt: now,
    isDefault: true,
    papers: []
  }
};

/**
 * 获取所有收藏夹
 * @returns 收藏夹列表
 */
export const getFavoriteFolders = (): FavoriteFolder[] => {
  try {
    const storedFolders = localStorage.getItem(FAVORITE_FOLDERS_KEY);
    let folders: FavoriteFolder[] = storedFolders ? JSON.parse(storedFolders) : [];
    
    // 确保默认收藏夹存在
    const defaultFolder = folders.find(f => f.id === DEFAULT_FOLDER_ID);
    if (!defaultFolder) {
      const newDefaultFolder = initializeDefaultFolder();
      folders.unshift(newDefaultFolder);
      localStorage.setItem(FAVORITE_FOLDERS_KEY, JSON.stringify(folders));
    }
    
    return folders;
  } catch (error) {
    console.error('获取收藏夹失败:', error);
    const defaultFolder = initializeDefaultFolder();
    return [defaultFolder];
  }
};

/**
 * 获取指定收藏夹
 * @param folderId 收藏夹ID
 * @returns 收藏夹或null
 */
export const getFavoriteFolder = (folderId: string): FavoriteFolder | null => {
  const folders = getFavoriteFolders();
  return folders.find(f => f.id === folderId) || null;
};

/**
 * 获取所有收藏的论文（兼容旧版本）
 * @returns 收藏的论文列表
 */
export const getFavoritePapers = (): Paper[] => {
  try {
    // 先尝试从新的收藏夹系统获取
    const folders = getFavoriteFolders();
    const allPapers: Paper[] = [];
    folders.forEach(folder => {
      allPapers.push(...folder.papers);
    });
    
    if (allPapers.length > 0) {
      return allPapers;
    }
    
    // 兼容旧版本数据
    const storedPapers = localStorage.getItem(FAVORITE_PAPERS_KEY);
    if (storedPapers) {
      const papers = JSON.parse(storedPapers);
      // 迁移到新系统
      if (papers.length > 0) {
        migrateOldFavorites(papers);
        return papers;
      }
    }
    
    return [];
  } catch (error) {
    console.error('获取收藏论文失败:', error);
    return [];
  }
};

/**
 * 迁移旧版本收藏数据
 * @param papers 旧版本论文数据
 */
const migrateOldFavorites = (papers: Paper[]): void => {
  try {
    const folders = getFavoriteFolders();
    const defaultFolder = folders.find(f => f.id === DEFAULT_FOLDER_ID);
    
    if (defaultFolder && papers.length > 0) {
      defaultFolder.papers = papers;
      defaultFolder.updatedAt = Date.now();
      localStorage.setItem(FAVORITE_FOLDERS_KEY, JSON.stringify(folders));
      // 清除旧数据
      localStorage.removeItem(FAVORITE_PAPERS_KEY);
      console.log('已迁移旧版本收藏数据到新系统');
    }
  } catch (error) {
    console.error('迁移收藏数据失败:', error);
  }
};

/**
 * 添加论文到收藏夹
 * @param paper 要收藏的论文
 * @param folderId 收藏夹ID，默认为默认收藏夹
 * @returns 是否成功
 */
export const addToFavorites = (paper: Paper, folderId: string = DEFAULT_FOLDER_ID): boolean => {
  try {
    // 检查paper对象是否有效
    if (!paper || !paper.id) {
      console.error('添加收藏失败: 无效的论文对象或ID');
      message.error('无法添加收藏: 论文数据无效');
      return false;
    }
    
    const folders = getFavoriteFolders();
    const targetFolder = folders.find(f => f.id === folderId);
    
    if (!targetFolder) {
      message.error('收藏夹不存在');
      return false;
    }
    
    // 检查是否已经在该收藏夹中
    if (targetFolder.papers.some(p => p && p.id === paper.id)) {
      message.info(`该论文已在${targetFolder.name}中`);
      return false;
    }
    
    // 检查是否在其他收藏夹中
    const existingFolder = folders.find(f => f.papers.some(p => p && p.id === paper.id));
    if (existingFolder) {
      message.info(`该论文已在${existingFolder.name}中收藏`);
      return false;
    }
    
    // 添加到收藏夹并保存
    const updatedPaper = { ...paper, isFavorite: true };
    targetFolder.papers.push(updatedPaper);
    targetFolder.updatedAt = Date.now();
    
    localStorage.setItem(FAVORITE_FOLDERS_KEY, JSON.stringify(folders));
    
    message.success(`论文已添加到${targetFolder.name}`);
    return true;
  } catch (error: any) {
    console.error('添加收藏失败:', error);
    
    // 获取详细错误信息
    let errorMessage = '添加收藏失败';
    
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
    message.error(errorMessage);
    return false;
  }
};

/**
 * 从收藏夹中移除论文
 * @param paperId 要移除的论文ID
 * @param folderId 收藏夹ID，如果不指定则从所有收藏夹中移除
 * @returns 是否成功
 */
export const removeFromFavorites = (paperId: string, folderId?: string): boolean => {
  try {
    // 检查paperId是否有效
    if (!paperId) {
      console.error('移除收藏失败: 无效的论文ID');
      message.error('无法移除收藏: 论文ID无效');
      return false;
    }
    
    const folders = getFavoriteFolders();
    let removed = false;
    let removedFromFolder = '';
    
    if (folderId) {
      // 从指定收藏夹移除
      const targetFolder = folders.find(f => f.id === folderId);
      if (!targetFolder) {
        message.error('收藏夹不存在');
        return false;
      }
      
      const originalLength = targetFolder.papers.length;
      targetFolder.papers = targetFolder.papers.filter(paper => paper && paper.id !== paperId);
      
      if (targetFolder.papers.length < originalLength) {
        targetFolder.updatedAt = Date.now();
        removed = true;
        removedFromFolder = targetFolder.name;
      }
    } else {
      // 从所有收藏夹中移除
      folders.forEach(folder => {
        const originalLength = folder.papers.length;
        folder.papers = folder.papers.filter(paper => paper && paper.id !== paperId);
        
        if (folder.papers.length < originalLength) {
          folder.updatedAt = Date.now();
          removed = true;
          removedFromFolder = folder.name;
        }
      });
    }
    
    if (removed) {
      localStorage.setItem(FAVORITE_FOLDERS_KEY, JSON.stringify(folders));
      message.success(`已从${removedFromFolder}中移除`);
      return true;
    } else {
      message.info('该论文不在指定收藏夹中');
      return false;
    }
  } catch (error: any) {
    console.error('移除收藏失败:', error);
    
    // 获取详细错误信息
    let errorMessage = '移除收藏失败';
    
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
    message.error(errorMessage);
    return false;
  }
};

/**
 * 切换论文的收藏状态
 * @param paper 要切换收藏状态的论文
 * @param folderId 收藏夹ID，默认为默认收藏夹
 * @returns 更新后的收藏状态
 */
export const toggleFavorite = (paper: Paper, folderId: string = DEFAULT_FOLDER_ID): boolean => {
  // 检查paper对象是否有效
  if (!paper) {
    console.error('切换收藏状态失败: 无效的论文对象');
    message.error('无法切换收藏状态: 论文数据无效');
    return false;
  }
  
  if (paper.isFavorite) {
    return paper.id ? removeFromFavorites(paper.id) : false;
  } else {
    return addToFavorites(paper, folderId);
  }
};

/**
 * 创建新收藏夹
 * @param params 创建参数
 * @returns 新创建的收藏夹或null
 */
export const createFavoriteFolder = (params: CreateFolderParams): FavoriteFolder | null => {
  try {
    if (!params.name || params.name.trim() === '') {
      message.error('收藏夹名称不能为空');
      return null;
    }
    
    const folders = getFavoriteFolders();
    
    // 检查名称是否重复
    if (folders.some(f => f.name === params.name.trim())) {
      message.error('收藏夹名称已存在');
      return null;
    }
    
    const now = Date.now();
    const newFolder: FavoriteFolder = {
      id: `folder_${now}`,
      name: params.name.trim(),
      description: params.description || '',
      createdAt: now,
      updatedAt: now,
      isDefault: false,
      papers: []
    };
    
    folders.push(newFolder);
    localStorage.setItem(FAVORITE_FOLDERS_KEY, JSON.stringify(folders));
    
    message.success(`收藏夹"${newFolder.name}"创建成功`);
    return newFolder;
  } catch (error) {
    console.error('创建收藏夹失败:', error);
    message.error('创建收藏夹失败');
    return null;
  }
};

/**
 * 更新收藏夹信息
 * @param params 更新参数
 * @returns 是否成功
 */
export const updateFavoriteFolder = (params: UpdateFolderParams): boolean => {
  try {
    const folders = getFavoriteFolders();
    const folder = folders.find(f => f.id === params.id);
    
    if (!folder) {
      message.error('收藏夹不存在');
      return false;
    }
    
    if (folder.isDefault) {
      message.error('不能修改默认收藏夹');
      return false;
    }
    
    if (params.name && params.name.trim() !== '') {
      // 检查名称是否重复
      if (folders.some(f => f.id !== params.id && f.name === params.name?.trim())) {
        message.error('收藏夹名称已存在');
        return false;
      }
      folder.name = params.name.trim();
    }
    
    if (params.description !== undefined) {
      folder.description = params.description;
    }
    
    folder.updatedAt = Date.now();
    localStorage.setItem(FAVORITE_FOLDERS_KEY, JSON.stringify(folders));
    
    message.success('收藏夹更新成功');
    return true;
  } catch (error) {
    console.error('更新收藏夹失败:', error);
    message.error('更新收藏夹失败');
    return false;
  }
};

/**
 * 删除收藏夹
 * @param folderId 收藏夹ID
 * @returns 是否成功
 */
export const deleteFavoriteFolder = (folderId: string): boolean => {
  try {
    const folders = getFavoriteFolders();
    const folder = folders.find(f => f.id === folderId);
    
    if (!folder) {
      message.error('收藏夹不存在');
      return false;
    }
    
    if (folder.isDefault) {
      message.error('不能删除默认收藏夹');
      return false;
    }
    
    if (folder.papers.length > 0) {
      message.error('请先清空收藏夹中的论文再删除');
      return false;
    }
    
    const updatedFolders = folders.filter(f => f.id !== folderId);
    localStorage.setItem(FAVORITE_FOLDERS_KEY, JSON.stringify(updatedFolders));
    
    message.success(`收藏夹"${folder.name}"删除成功`);
    return true;
  } catch (error) {
    console.error('删除收藏夹失败:', error);
    message.error('删除收藏夹失败');
    return false;
  }
};

/**
 * 移动论文到其他收藏夹
 * @param params 移动参数
 * @returns 是否成功
 */
export const movePaperToFolder = (params: MovePaperParams): boolean => {
  try {
    const folders = getFavoriteFolders();
    const fromFolder = folders.find(f => f.id === params.fromFolderId);
    const toFolder = folders.find(f => f.id === params.toFolderId);
    
    if (!fromFolder || !toFolder) {
      message.error('收藏夹不存在');
      return false;
    }
    
    if (params.fromFolderId === params.toFolderId) {
      message.info('论文已在目标收藏夹中');
      return false;
    }
    
    const paperIndex = fromFolder.papers.findIndex(p => p && p.id === params.paperId);
    if (paperIndex === -1) {
      message.error('论文不在源收藏夹中');
      return false;
    }
    
    // 检查目标收藏夹是否已有该论文
    if (toFolder.papers.some(p => p && p.id === params.paperId)) {
      message.error(`论文已在${toFolder.name}中`);
      return false;
    }
    
    // 移动论文
    const paper = fromFolder.papers[paperIndex];
    fromFolder.papers.splice(paperIndex, 1);
    toFolder.papers.push(paper);
    
    // 更新时间戳
    fromFolder.updatedAt = Date.now();
    toFolder.updatedAt = Date.now();
    
    localStorage.setItem(FAVORITE_FOLDERS_KEY, JSON.stringify(folders));
    
    message.success(`论文已移动到${toFolder.name}`);
    return true;
  } catch (error) {
    console.error('移动论文失败:', error);
    message.error('移动论文失败');
    return false;
  }
};

/**
 * 获取收藏夹统计信息
 * @returns 统计信息
 */
export const getFolderStats = (): FolderStats => {
  try {
    const folders = getFavoriteFolders();
    const totalPapers = folders.reduce((sum, folder) => sum + folder.papers.length, 0);
    const defaultFolder = folders.find(f => f.isDefault);
    const defaultFolderPapers = defaultFolder ? defaultFolder.papers.length : 0;
    
    return {
      totalFolders: folders.length,
      totalPapers,
      defaultFolderPapers
    };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return {
      totalFolders: 0,
      totalPapers: 0,
      defaultFolderPapers: 0
    };
  }
};

/**
 * 获取论文所在的收藏夹
 * @param paperId 论文ID
 * @returns 收藏夹或null
 */
export const getPaperFolder = (paperId: string): FavoriteFolder | null => {
  if (!paperId) return null;
  
  const folders = getFavoriteFolders();
  return folders.find(f => f.papers.some(p => p && p.id === paperId)) || null;
};

/**
 * 检查论文是否已收藏（兼容旧版本）
 * @param paperId 论文ID
 * @returns 是否已收藏
 */
export const isFavoritePaper = (paperId: string): boolean => {
  if (!paperId) {
    return false;
  }
  const folders = getFavoriteFolders();
  return folders.some(folder => folder.papers.some(paper => paper && paper.id === paperId));
};

/**
 * 加载收藏状态到论文列表（兼容旧版本）
 * @param papers 论文列表
 * @returns 更新收藏状态后的论文列表
 */
export const loadFavoriteStatus = (papers: Paper[]): Paper[] => {
  if (!papers || !Array.isArray(papers)) {
    return [];
  }
  
  const folders = getFavoriteFolders();
  const favoriteIds = new Set<string>();
  
  folders.forEach(folder => {
    folder.papers.forEach(paper => {
      if (paper && paper.id) {
        favoriteIds.add(paper.id);
      }
    });
  });
  
  return papers.map(paper => {
    if (!paper) return paper;
    return {
      ...paper,
      isFavorite: paper.id ? favoriteIds.has(paper.id) : false
    };
  });
};