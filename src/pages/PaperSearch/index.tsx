import React, { useState, useEffect } from 'react';
import { 
  Input, Button, Card, List, Tag, Space, Typography, Skeleton, Select, 
  Checkbox, Empty, Modal, Switch, message, Form, Tooltip, Badge, 
  Row, Col, Drawer, Tabs, Slider, InputNumber, Divider
} from 'antd';
import { 
  SearchOutlined, HeartOutlined, HeartFilled, DownloadOutlined, 
  InfoCircleOutlined, FileSearchOutlined, SettingOutlined, 
  PlusOutlined, DeleteOutlined, LinkOutlined, CalendarOutlined,
  UserOutlined, BookOutlined, FilterOutlined, SortAscendingOutlined,
  StarOutlined, EyeOutlined, CloseOutlined
} from '@ant-design/icons';
import { getFavoritePapers, addToFavorites, removeFromFavorites } from '../../services/favoriteService';
import { searchFromMultipleSources, getAvailableSources, getDefaultSources, downloadPaper } from '../../services/paperSearchService';
import { paperSearchProgressService } from '../../services/paperSearchProgressService';
import type { SearchProgress } from '../../services/paperSearchProgressService';
import SearchProgressComponent from '../../components/SearchProgress';
import type { Paper as ImportedPaper } from '../../types/paper';
import './style.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

// 扩展导入的Paper接口，添加组件需要的额外字段
interface Paper extends ImportedPaper {
  published_date?: string;
  paper_type?: string;
  doi?: string;
  conference?: string;
  volume?: string;
  pages?: string;
  publisher?: string;
}

// 自定义搜索源接口
interface CustomSource {
  id: string;
  name: string;
  url: string;
  description?: string;
  enabled?: boolean;
}

// 搜索历史接口
interface SearchHistory {
  query: string;
  timestamp: number;
  resultsCount: number;
}

const PaperSearch: React.FC = () => {
  // 基础搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  
  // 收藏和筛选状态
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [paperTypes, setPaperTypes] = useState<string[]>([]);
  const [selectedPaperTypes, setSelectedPaperTypes] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([2020, new Date().getFullYear()]);
  const [minCitations, setMinCitations] = useState<number>(0);
  
  // UI状态
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  
  // 搜索源状态
  const [availableSources, setAvailableSources] = useState<Array<{id: string, name: string, url: string}>>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(['arxiv']);
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceDescription, setNewSourceDescription] = useState('');
  
  // 高级搜索状态
  const [authorFilter, setAuthorFilter] = useState('');
  const [journalFilter, setJournalFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [maxResultsPerSource, setMaxResultsPerSource] = useState(30);
  
  // 进度搜索状态
  const [useProgressSearch, setUseProgressSearch] = useState(true);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const [isProgressSearching, setIsProgressSearching] = useState(false);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        const sources = await getAvailableSources();
        setAvailableSources(sources);
        
        if (sources.length > 0) {
          setSelectedSources([sources[0].id]);
        }
      } catch (error) {
        console.error('初始化搜索源失败:', error);
        const defaultSources = getDefaultSources();
        setAvailableSources(defaultSources);
        setSelectedSources(['arxiv']);
      }
      
      const paperTypeOptions = [
        'Research Paper',
        'Review Article', 
        'Conference Paper',
        'Journal Article',
        'Case Study',
        'Technical Report',
        'Thesis',
        'Dissertation',
        'Preprint',
        'Book Chapter'
      ];
      setPaperTypes(paperTypeOptions);
      
      loadSearchHistory();
      loadCustomSources();
    };
    
    initializeData();
  }, []);

  // 获取收藏的论文ID列表
  useEffect(() => {
    const favoritePapers = getFavoritePapers();
    setFavorites(favoritePapers
      .filter(paper => paper && paper.id)
      .map(paper => paper.id));
  }, []);

  // 加载搜索历史
  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('paper_search_history');
      if (history) {
        const parsedHistory: SearchHistory[] = JSON.parse(history);
        setSearchHistory(parsedHistory.slice(0, 20));
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  };

  // 保存搜索历史
  const saveSearchHistory = (query: string, resultsCount: number) => {
    try {
      const newHistory: SearchHistory = {
        query,
        timestamp: Date.now(),
        resultsCount
      };
      
      const updatedHistory = [newHistory, ...searchHistory.filter(h => h.query !== query)].slice(0, 20);
      setSearchHistory(updatedHistory);
      localStorage.setItem('paper_search_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  // 加载自定义搜索源
  const loadCustomSources = () => {
    try {
      const sources = localStorage.getItem('custom_search_sources');
      if (sources) {
        const parsedSources: CustomSource[] = JSON.parse(sources);
        setCustomSources(parsedSources);
      }
    } catch (error) {
      console.error('加载自定义搜索源失败:', error);
    }
  };

  // 保存自定义搜索源
  const saveCustomSources = (sources: CustomSource[]) => {
    try {
      setCustomSources(sources);
      localStorage.setItem('custom_search_sources', JSON.stringify(sources));
    } catch (error) {
      console.error('保存自定义搜索源失败:', error);
    }
  };

  // 处理搜索
  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    setSearchQuery(value);
    
    const enabledSources = availableSources.filter(source => 
      selectedSources.includes(source.id)
    );
    
    const enabledCustomSources = customSources.filter(source => 
      source.enabled !== false
    );
    const allSources = [...enabledSources, ...enabledCustomSources];
    
    if (allSources.length === 0) {
      message.warning('请至少选择一个搜索源');
      return;
    }

    if (useProgressSearch) {
      await handleProgressSearch(value, allSources);
    } else {
      await handleTraditionalSearch(value, allSources);
    }
  };

  // 进度搜索处理
  const handleProgressSearch = async (value: string, sources: any[]) => {
    setIsProgressSearching(true);
    setSearchProgress(null);
    setPapers([]);

    try {
      await paperSearchProgressService.searchWithProgress(
        value,
        sources,
        maxResultsPerSource,
        {
          onProgress: (progress) => {
            setSearchProgress(progress);
          },
          onComplete: (papers) => {
            const filteredResults = applyLocalFilters(papers);
            setPapers(filteredResults);
            saveSearchHistory(value, filteredResults.length);
            message.success(`搜索完成，找到 ${filteredResults.length} 篇论文`);
          },
          onError: (error) => {
            console.error('进度搜索失败:', error);
            message.error(`搜索失败: ${error}`);
            setSearchProgress({
              type: 'error',
              message: error,
              source: '搜索引擎',
              progress: 0,
              status: 'failed'
            });
          }
        }
      );
    } catch (error) {
      console.error('启动进度搜索失败:', error);
      message.error('启动搜索失败，请稍后重试');
    } finally {
      setIsProgressSearching(false);
    }
  };

  // 传统搜索处理
  const handleTraditionalSearch = async (value: string, sources: any[]) => {
    setLoading(true);

    try {
      const results = await searchFromMultipleSources(value, sources);
      
      if (Array.isArray(results)) {
        const filteredResults = applyLocalFilters(results);
        setPapers(filteredResults);
        saveSearchHistory(value, filteredResults.length);
        message.success(`搜索完成，找到 ${filteredResults.length} 篇论文`);
      } else {
        console.error('搜索结果不是有效的数组:', results);
        setPapers([]);
        message.error('搜索结果格式错误');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请稍后重试');
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  // 取消搜索
  const handleCancelSearch = () => {
    if (isProgressSearching) {
      paperSearchProgressService.stopSearch();
      setIsProgressSearching(false);
      setSearchProgress(null);
      message.info('搜索已取消');
    }
  };

  // 应用本地筛选
  const applyLocalFilters = (papers: Paper[]): Paper[] => {
    return papers.filter(paper => {
      if (paper.year && (paper.year < yearRange[0] || paper.year > yearRange[1])) {
        return false;
      }
      
      if (paper.citations !== undefined && paper.citations < minCitations) {
        return false;
      }
      
      if (authorFilter && paper.authors) {
        const authorMatch = paper.authors.some(author => 
          author.toLowerCase().includes(authorFilter.toLowerCase())
        );
        if (!authorMatch) return false;
      }
      
      if (journalFilter && paper.journal) {
        if (!paper.journal.toLowerCase().includes(journalFilter.toLowerCase())) {
          return false;
        }
      }
      
      if (keywordFilter && paper.keywords) {
        const keywordMatch = paper.keywords.some(keyword => 
          keyword.toLowerCase().includes(keywordFilter.toLowerCase())
        );
        if (!keywordMatch) return false;
      }
      
      if (selectedPaperTypes.length > 0 && paper.paper_type) {
        if (!selectedPaperTypes.includes(paper.paper_type)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // 处理收藏/取消收藏
  const handleFavorite = async (paperId: string, isFavorite: boolean) => {
    try {
      if (!paperId) {
        console.error('论文ID为空');
        return;
      }
      
      const paper = papers.find(p => p && p.id === paperId);
      if (!paper) {
        message.error('未找到论文信息');
        return;
      }

      if (isFavorite) {
        const success = removeFromFavorites(paperId);
        if (success) {
          setFavorites(favorites.filter(id => id !== paperId));
        }
      } else {
        const success = addToFavorites(paper);
        if (success) {
          setFavorites([...favorites, paperId]);
        }
      }
    } catch (error) {
      console.error('操作收藏失败:', error);
      message.error('操作失败，请稍后重试');
    }
  };

  // 处理下载
  const handleDownload = async (paper: Paper) => {
    try {
      if (!paper) {
        console.error('论文对象为空');
        message.error('无法下载：论文信息不完整');
        return;
      }
      
      message.info('正在准备下载...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('📥 下载论文:', paper.title);
      
      const success = await downloadPaper(paper.id || '', paper.url || '');
      
      if (!success) {
        if (paper.url) {
          window.open(paper.url, '_blank');
          message.info('已在新窗口中打开论文链接');
        }
      }
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败，请稍后重试');
    }
  };

  // 处理查看详情
  const handleViewDetails = (paper: Paper) => {
    if (!paper) {
      console.error('论文对象为空');
      message.error('无法查看详情：论文信息不完整');
      return;
    }
    
    setSelectedPaper(paper);
    setDetailsVisible(true);
    console.log('查看论文详情:', paper);
  };

  // 处理跳转到原始位置
  const handleViewOriginal = (paper: Paper) => {
    if (!paper || !paper.url) {
      message.error('无法跳转：论文链接不存在');
      return;
    }
    
    window.open(paper.url, '_blank');
    message.info('已在新窗口中打开论文原始页面');
  };

  // 处理排序方式变更
  const handleSortChange = (value: string) => {
    setSortBy(value);
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  // 处理搜索源设置变更
  const handleSourceChange = (sourceId: string, enabled: boolean) => {
    if (enabled) {
      setSelectedSources(prev => [...prev, sourceId]);
    } else {
      setSelectedSources(prev => prev.filter(id => id !== sourceId));
    }
  };

  // 添加自定义搜索源
  const handleAddCustomSource = () => {
    if (!newSourceName.trim()) {
      message.warning('请输入搜索源名称');
      return;
    }
    
    if (!newSourceUrl.trim()) {
      message.warning('请输入搜索源URL');
      return;
    }
    
    try {
      const url = new URL(newSourceUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('协议不支持');
      }
    } catch (_e) {
      message.error('请输入有效的URL，必须以http://或https://开头');
      return;
    }
    
    const nameExists = customSources.some(
      source => source.name.toLowerCase() === newSourceName.toLowerCase()
    );
    const urlExists = customSources.some(
      source => source.url.toLowerCase() === newSourceUrl.toLowerCase()
    );
    
    if (nameExists) {
      message.warning('已存在同名搜索源');
      return;
    }
    
    if (urlExists) {
      message.warning('已存在相同URL的搜索源');
      return;
    }
    
    const newSource: CustomSource = {
      id: `custom-${Date.now()}`,
      name: newSourceName.trim(),
      url: newSourceUrl.trim(),
      description: newSourceDescription.trim() || `自定义搜索源: ${newSourceName}`,
      enabled: true
    };
    
    const updatedSources = [...customSources, newSource];
    saveCustomSources(updatedSources);
    
    setNewSourceName('');
    setNewSourceUrl('');
    setNewSourceDescription('');
    
    message.success(`已添加搜索源: ${newSourceName}`);
  };
  
  // 删除自定义搜索源
  const handleRemoveCustomSource = (sourceId: string) => {
    const sourceToRemove = customSources.find(source => source.id === sourceId);
    const updatedSources = customSources.filter(source => source.id !== sourceId);
    
    saveCustomSources(updatedSources);
    
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter(id => id !== sourceId));
    }
    
    message.success(`已删除搜索源: ${sourceToRemove?.name || '未知'}`);
  };

  // 应用搜索设置
  const applySettings = () => {
    setSettingsVisible(false);
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="modern-search-container">
      {/* 主搜索区域 */}
      <div className="search-hero">
        <div className="search-hero-content">
          <div className="search-title-section">
            <FileSearchOutlined className="search-hero-icon" />
            <Title level={1} className="search-hero-title">
              智能论文检索
            </Title>
            <Text className="search-hero-subtitle">
              发现前沿研究，探索学术世界
            </Text>
          </div>
          
          <div className="search-main">
            <div className="search-input-wrapper">
              <Search
                placeholder="输入关键词、标题、作者或DOI进行搜索"
                enterButton={
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />} 
                    loading={loading || isProgressSearching}
                    className="search-btn"
                  >
                    搜索
                  </Button>
                }
                size="large"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                className="modern-search-input"
                allowClear
              />
            </div>
            
            <div className="search-controls">
              <Space size="middle">
                <div className="search-mode-switch">
                  <Text type="secondary">搜索模式：</Text>
                  <Switch
                    checked={useProgressSearch}
                    onChange={setUseProgressSearch}
                    checkedChildren="智能"
                    unCheckedChildren="标准"
                  />
                </div>
                
                <Button 
                  icon={<FilterOutlined />} 
                  onClick={() => setFiltersVisible(true)}
                  className={`control-btn ${filtersVisible ? 'active' : ''}`}
                >
                  筛选
                </Button>
                
                <Button 
                  icon={<SettingOutlined />} 
                  onClick={() => setSettingsVisible(true)}
                  className="control-btn"
                >
                  设置
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索进度 */}
      {(isProgressSearching || searchProgress) && (
        <div className="progress-section">
          <SearchProgressComponent
            progress={searchProgress}
            isSearching={isProgressSearching}
            onCancel={handleCancelSearch}
          />
        </div>
      )}

      {/* 搜索结果 */}
      {papers.length > 0 && (
        <div className="results-section">
          <Card className="results-card" bordered={false}>
            <div className="results-header">
              <div className="results-info">
                <Title level={4} style={{ margin: 0 }}>
                  找到 {papers.length} 篇论文
                </Title>
                <Text type="secondary">
                  {searchQuery && `关于 "${searchQuery}" 的搜索结果`}
                </Text>
              </div>
              
              <div className="results-controls">
                <Select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="sort-select"
                  suffixIcon={<SortAscendingOutlined />}
                >
                  <Option value="relevance">相关性</Option>
                  <Option value="date">发布时间</Option>
                  <Option value="citations">引用次数</Option>
                  <Option value="title">标题</Option>
                </Select>
              </div>
            </div>
            
            <List
              dataSource={papers}
              renderItem={(paper, index) => (
                <List.Item className="paper-item-modern">
                  <div className="paper-content">
                    <div className="paper-header">
                      <Title level={5} className="paper-title">
                        <a onClick={() => handleViewDetails(paper)}>
                          {paper.title}
                        </a>
                      </Title>
                      
                      <div className="paper-actions">
                        <Tooltip title={favorites.includes(paper.id || '') ? '取消收藏' : '收藏'}>
                          <Button
                            type="text"
                            icon={favorites.includes(paper.id || '') ? <HeartFilled /> : <HeartOutlined />}
                            onClick={() => handleFavorite(paper.id || '', favorites.includes(paper.id || ''))}
                            className={`action-btn ${favorites.includes(paper.id || '') ? 'favorited' : ''}`}
                          />
                        </Tooltip>
                        
                        <Tooltip title="查看详情">
                          <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(paper)}
                            className="action-btn"
                          />
                        </Tooltip>
                        
                        <Tooltip title="下载论文">
                          <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(paper)}
                            className="action-btn"
                          />
                        </Tooltip>
                        
                        <Tooltip title="查看原文">
                          <Button
                            type="text"
                            icon={<LinkOutlined />}
                            onClick={() => handleViewOriginal(paper)}
                            className="action-btn"
                          />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="paper-meta">
                      <Space split={<Divider type="vertical" />} wrap>
                        {paper.authors && paper.authors.length > 0 && (
                          <span>
                            <UserOutlined /> {paper.authors.slice(0, 3).join(', ')}
                            {paper.authors.length > 3 && ' 等'}
                          </span>
                        )}
                        
                        {paper.year && (
                          <span>
                            <CalendarOutlined /> {paper.year}
                          </span>
                        )}
                        
                        {paper.journal && (
                          <span>
                            <BookOutlined /> {paper.journal}
                          </span>
                        )}
                        
                        {paper.citations !== undefined && (
                          <span>
                            <StarOutlined /> 引用 {paper.citations}
                          </span>
                        )}
                      </Space>
                    </div>
                    
                    {paper.abstract && (
                      <Paragraph 
                        className="paper-abstract"
                        ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                      >
                        {paper.abstract}
                      </Paragraph>
                    )}
                    
                    {paper.keywords && paper.keywords.length > 0 && (
                      <div className="paper-keywords">
                        {paper.keywords.slice(0, 5).map((keyword, idx) => (
                          <Tag key={idx} className="keyword-tag">
                            {keyword}
                          </Tag>
                        ))}
                        {paper.keywords.length > 5 && (
                          <Tag className="keyword-tag">+{paper.keywords.length - 5}</Tag>
                        )}
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
              loading={loading}
            />
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !isProgressSearching && papers.length === 0 && searchQuery && (
        <div className="empty-section">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                未找到相关论文<br />
                <Text type="secondary">尝试使用不同的关键词或调整筛选条件</Text>
              </span>
            }
          />
        </div>
      )}

      {/* 筛选抽屉 */}
      <Drawer
        title="高级筛选"
        placement="right"
        onClose={() => setFiltersVisible(false)}
        open={filtersVisible}
        width={400}
        className="filter-drawer"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>发表年份</Text>
            <Slider
              range
              min={2000}
              max={new Date().getFullYear()}
              value={yearRange}
              onChange={setYearRange}
              marks={{
                2000: '2000',
                2010: '2010',
                2020: '2020',
                [new Date().getFullYear()]: '现在'
              }}
            />
          </div>
          
          <div>
            <Text strong>最小引用次数</Text>
            <InputNumber
              min={0}
              value={minCitations}
              onChange={(value) => setMinCitations(value || 0)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <Text strong>作者筛选</Text>
            <Input
              placeholder="输入作者姓名"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
            />
          </div>
          
          <div>
            <Text strong>期刊筛选</Text>
            <Input
              placeholder="输入期刊名称"
              value={journalFilter}
              onChange={(e) => setJournalFilter(e.target.value)}
            />
          </div>
          
          <div>
            <Text strong>关键词筛选</Text>
            <Input
              placeholder="输入关键词"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
            />
          </div>
          
          <div>
            <Text strong>论文类型</Text>
            <Checkbox.Group
              options={paperTypes}
              value={selectedPaperTypes}
              onChange={setSelectedPaperTypes}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            />
          </div>
          
          <Button 
            type="primary" 
            block 
            onClick={() => {
              setFiltersVisible(false);
              if (searchQuery) handleSearch(searchQuery);
            }}
          >
            应用筛选
          </Button>
        </Space>
      </Drawer>

      {/* 设置模态框 */}
      <Modal
        title="搜索设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onOk={applySettings}
        width={600}
        className="settings-modal"
      >
        <Tabs defaultActiveKey="sources">
          <TabPane tab="搜索源" key="sources">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>内置搜索源</Text>
                <div style={{ marginTop: 8 }}>
                  {availableSources.map(source => (
                    <div key={source.id} style={{ marginBottom: 8 }}>
                      <Checkbox
                        checked={selectedSources.includes(source.id)}
                        onChange={(e) => handleSourceChange(source.id, e.target.checked)}
                      >
                        {source.name}
                      </Checkbox>
                    </div>
                  ))}
                </div>
              </div>
              
              <Divider />
              
              <div>
                <Text strong>自定义搜索源</Text>
                <div style={{ marginTop: 8 }}>
                  {customSources.map(source => (
                    <div key={source.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{source.name}</span>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveCustomSource(source.id)}
                      />
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: 16 }}>
                  <Input
                    placeholder="搜索源名称"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <Input
                    placeholder="搜索源URL"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <Input
                    placeholder="描述（可选）"
                    value={newSourceDescription}
                    onChange={(e) => setNewSourceDescription(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddCustomSource}
                    block
                  >
                    添加自定义搜索源
                  </Button>
                </div>
              </div>
            </Space>
          </TabPane>
          
          <TabPane tab="搜索参数" key="params">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>每个源的最大结果数</Text>
                <InputNumber
                  min={10}
                  max={100}
                  value={maxResultsPerSource}
                  onChange={(value) => setMaxResultsPerSource(value || 30)}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </div>
            </Space>
          </TabPane>
        </Tabs>
      </Modal>

      {/* 论文详情模态框 */}
      <Modal
        title={selectedPaper?.title}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => selectedPaper && handleDownload(selectedPaper)}>
            下载
          </Button>
        ]}
        width={800}
        className="details-modal"
      >
        {selectedPaper && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>作者：</Text>
              <Text>{selectedPaper.authors?.join(', ') || '未知'}</Text>
            </div>
            
            <div>
              <Text strong>发表年份：</Text>
              <Text>{selectedPaper.year || '未知'}</Text>
            </div>
            
            {selectedPaper.journal && (
              <div>
                <Text strong>期刊：</Text>
                <Text>{selectedPaper.journal}</Text>
              </div>
            )}
            
            {selectedPaper.citations !== undefined && (
              <div>
                <Text strong>引用次数：</Text>
                <Text>{selectedPaper.citations}</Text>
              </div>
            )}
            
            {selectedPaper.abstract && (
              <div>
                <Text strong>摘要：</Text>
                <Paragraph>{selectedPaper.abstract}</Paragraph>
              </div>
            )}
            
            {selectedPaper.keywords && selectedPaper.keywords.length > 0 && (
              <div>
                <Text strong>关键词：</Text>
                <div style={{ marginTop: 8 }}>
                  {selectedPaper.keywords.map((keyword, idx) => (
                    <Tag key={idx} style={{ marginBottom: 4 }}>
                      {keyword}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            
            {selectedPaper.url && (
              <div>
                <Text strong>原文链接：</Text>
                <Button 
                  type="link" 
                  icon={<LinkOutlined />}
                  onClick={() => window.open(selectedPaper.url, '_blank')}
                >
                  查看原文
                </Button>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default PaperSearch;