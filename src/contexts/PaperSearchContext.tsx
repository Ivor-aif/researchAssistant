import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';

interface SearchSource {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

interface PaperSearchContextType {
  searchSources: SearchSource[];
  activeSearchSources: SearchSource[];
  defaultSearchSource: SearchSource;
  addSearchSource: (source: Omit<SearchSource, 'id'>) => void;
  updateSearchSource: (id: string, source: Partial<SearchSource>) => void;
  removeSearchSource: (id: string) => void;
  toggleSearchSource: (id: string) => void;
}

// 创建上下文
const PaperSearchContext = createContext<PaperSearchContextType | undefined>(undefined);

// 自定义Hook，用于在组件中访问上下文
export const usePaperSearch = () => {
  const context = useContext(PaperSearchContext);
  if (!context) {
    throw new Error('usePaperSearch must be used within a PaperSearchProvider');
  }
  return context;
};

interface PaperSearchProviderProps {
  children: ReactNode;
}

// 默认的arxiv搜索源
const DEFAULT_ARXIV_SOURCE: SearchSource = {
  id: 'arxiv',
  name: 'arXiv',
  url: 'https://arxiv.org/search/',
  isActive: true
};

// 提供者组件
export const PaperSearchProvider: React.FC<PaperSearchProviderProps> = ({ children }) => {
  // 状态管理
  const [searchSources, setSearchSources] = useState<SearchSource[]>([]);

  // 初始化时从本地存储加载搜索源配置
  useEffect(() => {
    const storedSources = localStorage.getItem('paperSearchSources');
    if (storedSources) {
      try {
        const parsedSources = JSON.parse(storedSources);
        setSearchSources(parsedSources);
      } catch (error) {
        console.error('加载搜索源配置失败:', error);
        // 如果加载失败，使用默认配置
        setSearchSources([DEFAULT_ARXIV_SOURCE]);
      }
    } else {
      // 如果没有存储的配置，使用默认配置
      setSearchSources([DEFAULT_ARXIV_SOURCE]);
    }
  }, []);

  // 当搜索源变化时，保存到本地存储
  useEffect(() => {
    if (searchSources.length > 0) {
      localStorage.setItem('paperSearchSources', JSON.stringify(searchSources));
    }
  }, [searchSources]);

  // 获取活跃的搜索源
  const activeSearchSources = searchSources.filter(source => source.isActive);

  // 获取默认搜索源（如果没有活跃的，则使用第一个）
  const defaultSearchSource = activeSearchSources.length > 0 
    ? activeSearchSources[0] 
    : searchSources.length > 0 
      ? searchSources[0] 
      : DEFAULT_ARXIV_SOURCE;

  // 添加新的搜索源
  const addSearchSource = (source: Omit<SearchSource, 'id'>) => {
    const newSource: SearchSource = {
      ...source,
      id: `source_${Date.now()}`
    };
    
    // 检查URL是否有效
    try {
      new URL(newSource.url);
    } catch (error) {
      message.error('请输入有效的URL');
      return;
    }
    
    // 检查是否已存在相同名称或URL的搜索源
    if (searchSources.some(s => s.name === newSource.name || s.url === newSource.url)) {
      message.error('已存在相同名称或URL的搜索源');
      return;
    }
    
    setSearchSources(prev => [...prev, newSource]);
    message.success(`已添加搜索源: ${newSource.name}`);
  };

  // 更新搜索源
  const updateSearchSource = (id: string, source: Partial<SearchSource>) => {
    setSearchSources(prev => 
      prev.map(s => s.id === id ? { ...s, ...source } : s)
    );
  };

  // 移除搜索源
  const removeSearchSource = (id: string) => {
    // 不允许删除最后一个搜索源
    if (searchSources.length <= 1) {
      message.warning('至少需要保留一个搜索源');
      return;
    }
    
    setSearchSources(prev => prev.filter(s => s.id !== id));
    message.success('已移除搜索源');
  };

  // 切换搜索源的活跃状态
  const toggleSearchSource = (id: string) => {
    // 如果只有一个搜索源，不允许禁用
    if (searchSources.length === 1 && searchSources[0].id === id && searchSources[0].isActive) {
      message.warning('至少需要一个活跃的搜索源');
      return;
    }
    
    // 如果当前活跃的搜索源只有一个，且要禁用的就是这个，不允许禁用
    const activeCount = searchSources.filter(s => s.isActive).length;
    if (activeCount === 1 && searchSources.find(s => s.id === id)?.isActive) {
      message.warning('至少需要一个活跃的搜索源');
      return;
    }
    
    setSearchSources(prev => 
      prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    );
  };

  const value = {
    searchSources,
    activeSearchSources,
    defaultSearchSource,
    addSearchSource,
    updateSearchSource,
    removeSearchSource,
    toggleSearchSource
  };

  return <PaperSearchContext.Provider value={value}>{children}</PaperSearchContext.Provider>;
};