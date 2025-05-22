import type { Paper } from '../types/paper';
import { message } from 'antd';

// 本地存储键名
const FAVORITE_PAPERS_KEY = 'favorite_papers';

/**
 * 获取所有收藏的论文
 * @returns 收藏的论文列表
 */
export const getFavoritePapers = (): Paper[] => {
  try {
    const storedPapers = localStorage.getItem(FAVORITE_PAPERS_KEY);
    return storedPapers ? JSON.parse(storedPapers) : [];
  } catch (error) {
    console.error('获取收藏论文失败:', error);
    return [];
  }
};

/**
 * 添加论文到收藏
 * @param paper 要收藏的论文
 * @returns 是否成功
 */
export const addToFavorites = (paper: Paper): boolean => {
  try {
    const favoritePapers = getFavoritePapers();
    
    // 检查是否已经收藏
    if (favoritePapers.some(p => p.id === paper.id)) {
      message.info('该论文已在收藏列表中');
      return false;
    }
    
    // 添加到收藏并保存
    const updatedPaper = { ...paper, isFavorite: true };
    const updatedFavorites = [...favoritePapers, updatedPaper];
    localStorage.setItem(FAVORITE_PAPERS_KEY, JSON.stringify(updatedFavorites));
    
    message.success('论文已添加到收藏');
    return true;
  } catch (error) {
    console.error('添加收藏失败:', error);
    message.error('添加收藏失败');
    return false;
  }
};

/**
 * 从收藏中移除论文
 * @param paperId 要移除的论文ID
 * @returns 是否成功
 */
export const removeFromFavorites = (paperId: string): boolean => {
  try {
    const favoritePapers = getFavoritePapers();
    const updatedFavorites = favoritePapers.filter(paper => paper.id !== paperId);
    
    localStorage.setItem(FAVORITE_PAPERS_KEY, JSON.stringify(updatedFavorites));
    message.success('已从收藏中移除');
    return true;
  } catch (error) {
    console.error('移除收藏失败:', error);
    message.error('移除收藏失败');
    return false;
  }
};

/**
 * 切换论文的收藏状态
 * @param paper 要切换收藏状态的论文
 * @returns 更新后的收藏状态
 */
export const toggleFavorite = (paper: Paper): boolean => {
  if (paper.isFavorite) {
    return removeFromFavorites(paper.id);
  } else {
    return addToFavorites(paper);
  }
};

/**
 * 检查论文是否已收藏
 * @param paperId 论文ID
 * @returns 是否已收藏
 */
export const isFavoritePaper = (paperId: string): boolean => {
  const favoritePapers = getFavoritePapers();
  return favoritePapers.some(paper => paper.id === paperId);
};

/**
 * 加载收藏状态到论文列表
 * @param papers 论文列表
 * @returns 更新收藏状态后的论文列表
 */
export const loadFavoriteStatus = (papers: Paper[]): Paper[] => {
  const favoritePapers = getFavoritePapers();
  const favoriteIds = new Set(favoritePapers.map(paper => paper.id));
  
  return papers.map(paper => ({
    ...paper,
    isFavorite: favoriteIds.has(paper.id)
  }));
};