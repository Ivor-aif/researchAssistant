import React, { useState, useEffect } from 'react';
import { 
  Input, Button, Card, List, Tag, Space, Typography, Skeleton, Select, 
  Checkbox, Empty, Modal, Switch, message, Form, Tooltip, Badge, 
  Row, Col, Alert, Drawer, Tabs, Slider, InputNumber
} from 'antd';
import { 
  SearchOutlined, HeartOutlined, HeartFilled, DownloadOutlined, 
  InfoCircleOutlined, FileSearchOutlined, SettingOutlined, 
  PlusOutlined, DeleteOutlined, LinkOutlined, CalendarOutlined,
  UserOutlined, BookOutlined, FilterOutlined, SortAscendingOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { getFavoritePapers, addToFavorites, removeFromFavorites } from '../../services/favoriteService';
import { searchFromMultipleSources, getAvailableSources, getDefaultSources, downloadPaper } from '../../services/paperSearchService';
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
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [authorFilter, setAuthorFilter] = useState('');
  const [journalFilter, setJournalFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 获取可用的搜索源
        const sources = await getAvailableSources();
        setAvailableSources(sources);
        
        // 设置默认选中的搜索源
        if (sources.length > 0) {
          setSelectedSources([sources[0].id]); // 默认选中第一个源
        }
      } catch (error) {
        console.error('初始化搜索源失败:', error);
        // 使用默认搜索源
        const defaultSources = getDefaultSources();
        setAvailableSources(defaultSources);
        setSelectedSources(['arxiv']);
      }
      
      // 设置论文类型
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
      
      // 加载搜索历史
      loadSearchHistory();
      
      // 加载自定义搜索源
      loadCustomSources();
    };
    
    initializeData();
  }, []);

  // 获取收藏的论文ID列表
  useEffect(() => {
    // 使用favoriteService获取收藏的论文
    const favoritePapers = getFavoritePapers();
    // 确保每个paper对象都有id属性
    setFavorites(favoritePapers
      .filter(paper => paper && paper.id) // 过滤掉没有id的paper
      .map(paper => paper.id));
  }, []);

  // 加载搜索历史
  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('paper_search_history');
      if (history) {
        const parsedHistory: SearchHistory[] = JSON.parse(history);
        // 只保留最近20条记录
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
    setLoading(true);

    try {
      console.log('搜索参数:', {
        query: value,
        sort_by: sortBy,
        paper_types: selectedPaperTypes.length > 0 ? selectedPaperTypes : undefined,
        sources: selectedSources,
        year_range: yearRange,
        min_citations: minCitations,
        author: authorFilter,
        journal: journalFilter,
        keywords: keywordFilter
      });

      // 准备搜索源列表
      const enabledSources = availableSources.filter(source => 
        selectedSources.includes(source.id)
      );
      
      // 合并内置源和自定义源
      const enabledCustomSources = customSources.filter(source => 
        source.enabled !== false
      );
      const allSources = [...enabledSources, ...enabledCustomSources];
      
      if (allSources.length === 0) {
        message.warning('请至少选择一个搜索源');
        setLoading(false);
        return;
      }

      // 调用搜索API
      const results = await searchFromMultipleSources(value, allSources);
      
      // 确保results是一个有效的数组
      if (Array.isArray(results)) {
        // 应用本地筛选
        const filteredResults = applyLocalFilters(results);
        setPapers(filteredResults);
        
        // 保存搜索历史
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
      setPapers([]); // 确保在错误时papers仍然是数组
    } finally {
      setLoading(false);
    }
  };

  // 应用本地筛选
  const applyLocalFilters = (papers: Paper[]): Paper[] => {
    return papers.filter(paper => {
      // 年份筛选
      if (paper.year && (paper.year < yearRange[0] || paper.year > yearRange[1])) {
        return false;
      }
      
      // 引用次数筛选
      if (paper.citations !== undefined && paper.citations < minCitations) {
        return false;
      }
      
      // 作者筛选
      if (authorFilter && paper.authors) {
        const authorMatch = paper.authors.some(author => 
          author.toLowerCase().includes(authorFilter.toLowerCase())
        );
        if (!authorMatch) return false;
      }
      
      // 期刊筛选
      if (journalFilter && paper.journal) {
        if (!paper.journal.toLowerCase().includes(journalFilter.toLowerCase())) {
          return false;
        }
      }
      
      // 关键词筛选
      if (keywordFilter && paper.keywords) {
        const keywordMatch = paper.keywords.some(keyword => 
          keyword.toLowerCase().includes(keywordFilter.toLowerCase())
        );
        if (!keywordMatch) return false;
      }
      
      // 论文类型筛选
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
      // 确保paperId存在
      if (!paperId) {
        console.error('论文ID为空');
        return;
      }
      
      // 找到对应的论文
      const paper = papers.find(p => p && p.id === paperId);
      if (!paper) {
        message.error('未找到论文信息');
        return;
      }

      if (isFavorite) {
        // 取消收藏
        const success = removeFromFavorites(paperId);
        if (success) {
          setFavorites(favorites.filter(id => id !== paperId));
        }
      } else {
        // 添加收藏
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
      // 确保paper对象存在
      if (!paper) {
        console.error('论文对象为空');
        message.error('无法下载：论文信息不完整');
        return;
      }
      
      // 模拟下载功能
      message.info('正在准备下载...');
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('📥 下载论文:', paper.title);
      
      const success = await downloadPaper(paper.id || '', paper.url || '');
      
      if (!success) {
        // 如果下载失败，尝试直接打开链接
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
    // 确保paper对象存在
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

  // 处理快速搜索（从搜索历史）
  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  // 清空搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('paper_search_history');
    message.success('搜索历史已清空');
  };

  // 处理排序方式变更
  const handleSortChange = (value: string) => {
    setSortBy(value);
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  // 处理论文类型选择变更
  const handlePaperTypeChange = (checkedValues: string[]) => {
    setSelectedPaperTypes(checkedValues);
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
    // 验证输入
    if (!newSourceName.trim()) {
      message.warning('请输入搜索源名称');
      return;
    }
    
    if (!newSourceUrl.trim()) {
      message.warning('请输入搜索源URL');
      return;
    }
    
    // 验证URL格式
    try {
      const url = new URL(newSourceUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('协议不支持');
      }
    } catch (_e) {
      message.error('请输入有效的URL，必须以http://或https://开头');
      return;
    }
    
    // 检查是否已存在同名源或同URL源
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
    
    // 创建新的自定义源
    const newSource: CustomSource = {
      id: `custom-${Date.now()}`,
      name: newSourceName.trim(),
      url: newSourceUrl.trim(),
      description: newSourceDescription.trim() || `自定义搜索源: ${newSourceName}`,
      enabled: true
    };
    
    // 添加到自定义源列表并保存
    const updatedSources = [...customSources, newSource];
    saveCustomSources(updatedSources);
    
    // 清空输入框
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
    
    // 如果删除的源正在被选中，从选中列表中移除
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter(id => id !== sourceId));
    }
    
    message.success(`已删除搜索源: ${sourceToRemove?.name || '未知'}`);
  };

  // 切换自定义搜索源的启用状态
  const handleToggleCustomSource = (sourceId: string, enabled: boolean) => {
    const updatedSources = customSources.map(source => 
      source.id === sourceId ? { ...source, enabled } : source
    );
    saveCustomSources(updatedSources);
    
    const sourceName = customSources.find(s => s.id === sourceId)?.name || '未知';
    message.success(`${sourceName} 已${enabled ? '启用' : '禁用'}`);
  };

  // 应用搜索设置
  const applySettings = () => {
    setSettingsVisible(false);
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="paper-search-container">
      <Card 
        title={
          <div className="paper-search-header">
            <FileSearchOutlined className="paper-search-icon" />
            <span>智能论文检索系统</span>
            <Badge count={papers.length} showZero style={{ marginLeft: 16 }} />
          </div>
        } 
        bordered={false}
        className="paper-search-card"
        extra={
          <Space>
            <Tooltip title="高级筛选">
              <Button 
                icon={<FilterOutlined />} 
                onClick={() => setFiltersVisible(true)}
                type={filtersVisible ? 'primary' : 'default'}
              >
                筛选
              </Button>
            </Tooltip>
            <Tooltip title="搜索设置">
              <Button 
                icon={<SettingOutlined />} 
                onClick={() => setSettingsVisible(true)}
              >
                设置
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="search-tabs">
          <TabPane tab={<span><SearchOutlined />搜索</span>} key="search">
            <div className="search-form">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Search
                    placeholder="输入关键词、标题、作者或DOI进行搜索"
                    enterButton={
                      <Button 
                        type="primary" 
                        icon={<SearchOutlined />} 
                        loading={loading}
                        size="large"
                      >
                        搜索论文
                      </Button>
                    }
                    size="large"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSearch={handleSearch}
                    className="search-input"
                    allowClear
                  />
                </Col>
              </Row>
              
              {/* 快速搜索建议 */}
              {searchHistory.length > 0 && !searchQuery && (
                <div className="search-suggestions">
                  <Text type="secondary" style={{ fontSize: '12px' }}>最近搜索：</Text>
                  <Space wrap style={{ marginTop: 8 }}>
                    {searchHistory.slice(0, 5).map((history, index) => (
                      <Tag 
                        key={index}
                        onClick={() => handleQuickSearch(history.query)}
                        style={{ cursor: 'pointer' }}
                        color="blue"
                      >
                        {history.query} ({history.resultsCount})
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}
              
              {/* 高级搜索选项 */}
              {advancedSearch && (
                <Card size="small" className="advanced-search-card" style={{ marginTop: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Input
                        placeholder="作者"
                        prefix={<UserOutlined />}
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                      />
                    </Col>
                    <Col span={8}>
                      <Input
                        placeholder="期刊/会议"
                        prefix={<BookOutlined />}
                        value={journalFilter}
                        onChange={(e) => setJournalFilter(e.target.value)}
                      />
                    </Col>
                    <Col span={8}>
                      <Input
                        placeholder="关键词"
                        prefix={<SearchOutlined />}
                        value={keywordFilter}
                        onChange={(e) => setKeywordFilter(e.target.value)}
                      />
                    </Col>
                  </Row>
                </Card>
              )}
              
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button 
                  type="link" 
                  onClick={() => setAdvancedSearch(!advancedSearch)}
                  icon={advancedSearch ? <EyeOutlined /> : <SearchOutlined />}
                >
                  {advancedSearch ? '隐藏' : '显示'}高级搜索
                </Button>
              </div>
            </div>

            {/* 快速筛选条件 */}
            {(selectedPaperTypes.length > 0 || minCitations > 0 || yearRange[0] > 2020 || yearRange[1] < new Date().getFullYear()) && (
              <Alert
                message="当前筛选条件"
                description={
                  <Space wrap>
                    {selectedPaperTypes.length > 0 && (
                      <Tag color="blue">类型: {selectedPaperTypes.join(', ')}</Tag>
                    )}
                    {minCitations > 0 && (
                      <Tag color="green">引用数 ≥ {minCitations}</Tag>
                    )}
                    {(yearRange[0] > 2020 || yearRange[1] < new Date().getFullYear()) && (
                      <Tag color="orange">年份: {yearRange[0]}-{yearRange[1]}</Tag>
                    )}
                    <Button 
                      size="small" 
                      type="link" 
                      onClick={() => {
                        setSelectedPaperTypes([]);
                        setMinCitations(0);
                        setYearRange([2020, new Date().getFullYear()]);
                        setAuthorFilter('');
                        setJournalFilter('');
                        setKeywordFilter('');
                      }}
                    >
                      清除筛选
                    </Button>
                  </Space>
                }
                type="info"
                showIcon
                closable
                style={{ marginTop: 16 }}
              />
            )}
          </TabPane>
          
          <TabPane tab={<span><HeartOutlined />收藏 ({favorites.length})</span>} key="favorites">
            <div className="favorites-content">
              {favorites.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={getFavoritePapers()}
                  renderItem={paper => (
                    <List.Item
                      className="paper-item"
                      actions={[
                        <Button 
                          icon={<HeartFilled />} 
                          onClick={() => handleFavorite(paper.id, true)}
                          className="action-button favorite-button favorited"
                          danger
                        >
                          取消收藏
                        </Button>,
                        <Button 
                          icon={<DownloadOutlined />} 
                          onClick={() => handleDownload(paper)}
                          className="action-button download-button"
                        >
                          下载
                        </Button>,
                        <Button 
                          icon={<LinkOutlined />} 
                          onClick={() => handleViewOriginal(paper)}
                          className="action-button"
                        >
                          原文
                        </Button>
                      ]}
                    >
                      <Title level={5} className="paper-title">{paper.title || '未知标题'}</Title>
                      <div className="paper-meta">
                        <Text><UserOutlined /> {paper.authors?.join(', ') || '未知作者'}</Text>
                        <br />
                        <Text><CalendarOutlined /> {paper.year || '未知年份'}</Text>
                        <br />
                        <Text><BookOutlined /> {paper.journal || '未知期刊'}</Text>
                      </div>
                      <Paragraph ellipsis={{ rows: 2 }} className="paper-abstract">
                        {paper.abstract || '暂无摘要'}
                      </Paragraph>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无收藏的论文" />
              )}
            </div>
          </TabPane>
        </Tabs>

        <div className="results-header">
          <div className="results-info">
            <Title level={4}>
              <FileSearchOutlined /> 
              {papers.length > 0 ? `搜索结果 (${papers.length})` : '搜索结果'}
            </Title>
            {searchQuery && (
              <Text type="secondary">关键词: "{searchQuery}"</Text>
            )}
          </div>
          <Space>
            <Select
              value={sortBy}
              onChange={handleSortChange}
              className="sort-select"
              placeholder="排序方式"
              suffixIcon={<SortAscendingOutlined />}
            >
              <Option value="relevance">按相关度排序</Option>
              <Option value="date_desc">按日期排序（最新）</Option>
              <Option value="date_asc">按日期排序（最早）</Option>
              <Option value="citations_desc">按引用次数排序</Option>
              <Option value="citations_asc">按引用次数排序（升序）</Option>
            </Select>
          </Space>
        </div>

        {loading ? (
          <List
            itemLayout="vertical"
            dataSource={Array(5).fill(0).map((_, index) => ({ id: `skeleton-${index}` }))}
            renderItem={(item) => (
              <List.Item key={item.id}>
                <Skeleton active avatar={false} title paragraph={{ rows: 4 }} />
              </List.Item>
            )}
            className="paper-list"
          />
        ) : papers && Array.isArray(papers) && papers.length > 0 ? (
          <List
            itemLayout="vertical"
            size="large"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              pageSizeOptions: ['5', '10', '20', '50']
            }}
            dataSource={papers && Array.isArray(papers) ? papers.filter(paper => paper && typeof paper === 'object') : []}
            renderItem={paper => {
              // 确保paper.id存在
              const paperId = paper?.id || '';
              const isFavorite = !!(paperId && favorites.includes(paperId));
              
              return (
                <List.Item
                  className="paper-item"
                  key={paperId || Math.random()}
                  actions={[
                    <Button 
                      icon={isFavorite ? <HeartFilled /> : <HeartOutlined />} 
                      onClick={() => paperId && handleFavorite(paperId, isFavorite)}
                      className={`action-button favorite-button ${isFavorite ? 'favorited' : ''}`}
                      type={isFavorite ? 'primary' : 'default'}
                    >
                      {isFavorite ? '已收藏' : '收藏'}
                    </Button>,
                    <Button 
                      icon={<DownloadOutlined />} 
                      onClick={() => handleDownload(paper)}
                      className="action-button download-button"
                    >
                      下载
                    </Button>,
                    <Button 
                      icon={<LinkOutlined />} 
                      onClick={() => handleViewOriginal(paper)}
                      className="action-button"
                    >
                      原文
                    </Button>,
                    <Button 
                      icon={<InfoCircleOutlined />} 
                      onClick={() => handleViewDetails(paper)}
                      className="action-button details-button"
                    >
                      详情
                    </Button>
                  ]}
                  extra={
                    <div className="paper-extra">
                      <Space direction="vertical" align="end">
                        <Tag color={paper.source === 'arXiv' ? 'blue' : 'green'}>
                          {paper.source || '未知来源'}
                        </Tag>
                        {paper.citations && (
                          <Text type="secondary">
                            引用: {paper.citations}
                          </Text>
                        )}
                        {paper.doi && (
                          <Text type="secondary" copyable={{ text: paper.doi }}>
                            DOI: {paper.doi}
                          </Text>
                        )}
                      </Space>
                    </div>
                  }
                >
                  <List.Item.Meta
                    title={
                      <div className="paper-title-container">
                        <Title level={5} className="paper-title">
                          {paper.title || '未知标题'}
                        </Title>
                        {paper.conference && (
                          <Tag color="orange">{paper.conference}</Tag>
                        )}
                      </div>
                    }
                    description={
                      <div className="paper-meta">
                        <Space wrap>
                          <Text><UserOutlined /> {paper.authors && Array.isArray(paper.authors) ? paper.authors.join(', ') : '未知作者'}</Text>
                          <Text><CalendarOutlined /> {paper.year || '未知年份'}</Text>
                          {paper.journal && (
                            <Text><BookOutlined /> {paper.journal}</Text>
                          )}
                          {paper.volume && (
                            <Text>Vol. {paper.volume}</Text>
                          )}
                          {paper.pages && (
                            <Text>pp. {paper.pages}</Text>
                          )}
                        </Space>
                      </div>
                    }
                  />
                  <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }} className="paper-abstract">
                    {paper.abstract || '暂无摘要'}
                  </Paragraph>
                  <div className="paper-keywords">
                    {paper.keywords && Array.isArray(paper.keywords) ? 
                      paper.keywords.map((keyword, index) => (
                        <Tag key={index} color="blue" className="keyword-tag">{keyword}</Tag>
                      ))
                    : null}
                  </div>
                </List.Item>
              );
            }}
            className="paper-list"
          />
        ) : searchQuery ? (
          <div className="empty-state">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  未找到相关论文，请尝试其他关键词
                </span>
              }
            >
              <Button type="primary" onClick={() => setSearchQuery('')}>
                清除搜索
              </Button>
            </Empty>
          </div>
        ) : null}
      </Card>

      {/* 筛选抽屉 */}
      <Drawer
        title="高级筛选"
        placement="right"
        onClose={() => setFiltersVisible(false)}
        open={filtersVisible}
        width={400}
      >
        <div className="filter-content">
          <div className="filter-section">
            <Title level={5}>论文类型</Title>
            <Checkbox.Group
              options={paperTypes && Array.isArray(paperTypes) ? paperTypes.map(type => ({ label: type, value: type })) : []}
              value={selectedPaperTypes}
              onChange={setSelectedPaperTypes}
            />
          </div>
          
          <div className="filter-section">
            <Title level={5}>发表年份</Title>
            <Slider
              range
              min={2020}
              max={new Date().getFullYear()}
              value={yearRange}
              onChange={(value: number | number[]) => {
                if (Array.isArray(value) && value.length === 2) {
                  setYearRange([value[0], value[1]]);
                }
              }}
              marks={{
                2020: '2020',
                [new Date().getFullYear()]: new Date().getFullYear().toString()
              }}
            />
          </div>
          
          <div className="filter-section">
            <Title level={5}>最小引用数</Title>
            <InputNumber
              min={0}
              value={minCitations}
              onChange={(value: number | null) => setMinCitations(value || 0)}
              style={{ width: '100%' }}
              placeholder="输入最小引用数"
            />
          </div>
          
          <div className="filter-section">
            <Title level={5}>作者筛选</Title>
            <Input
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              placeholder="输入作者姓名"
              allowClear
            />
          </div>
          
          <div className="filter-section">
            <Title level={5}>期刊/会议筛选</Title>
            <Input
              value={journalFilter}
              onChange={(e) => setJournalFilter(e.target.value)}
              placeholder="输入期刊或会议名称"
              allowClear
            />
          </div>
          
          <div className="filter-section">
            <Title level={5}>关键词筛选</Title>
            <Input
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="输入关键词"
              allowClear
            />
          </div>
          
          <div className="filter-actions">
            <Space>
              <Button 
                onClick={() => {
                  setSelectedPaperTypes([]);
                  setMinCitations(0);
                  setYearRange([2020, new Date().getFullYear()]);
                  setAuthorFilter('');
                  setJournalFilter('');
                  setKeywordFilter('');
                }}
              >
                重置筛选
              </Button>
              <Button 
                type="primary" 
                onClick={() => {
                  if (searchQuery) {
                    handleSearch(searchQuery);
                  }
                  setFiltersVisible(false);
                }}
              >
                应用筛选
              </Button>
            </Space>
          </div>
        </div>
      </Drawer>
      
      {/* 设置模态框 */}
      <Modal
        title="搜索设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSettingsVisible(false)}>取消</Button>,
          <Button key="apply" type="primary" onClick={applySettings} className="settings-button">应用设置</Button>
        ]}
        className="settings-modal"
      >
        <Title level={5} className="settings-title">选择搜索源</Title>
        <div className="settings-item">
          <Space direction="vertical" style={{ width: '100%' }}>
            {availableSources.map((source) => (
              <div key={source.id}>
                <Switch 
                  checked={selectedSources.includes(source.id)} 
                  onChange={(checked) => handleSourceChange(source.id, checked)} 
                />
                <Text style={{ marginLeft: 8 }}>{source.name}</Text>
              </div>
            ))}
          </Space>
        </div>
        
        <Title level={5} className="settings-title" style={{ marginTop: 20 }}>自定义搜索源</Title>
        <div className="settings-item">
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* 显示已添加的自定义搜索源 */}
            {customSources && Array.isArray(customSources) ? customSources.map(source => (
              <div key={source.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text>{source.name}</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>{source.url}</Text>
                </div>
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleRemoveCustomSource(source.id)}
                />
              </div>
            )) : null}
            
            {/* 添加新的自定义搜索源 */}
            <div style={{ marginTop: 10 }}>
              <Form layout="vertical" style={{ marginBottom: 0 }}>
                <Form.Item label="搜索源名称" style={{ marginBottom: 8 }}>
                  <Input 
                    placeholder="例如: Google Scholar" 
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="搜索源URL" style={{ marginBottom: 8 }}>
                  <Input 
                    placeholder="例如: https://scholar.google.com" 
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                  />
                </Form.Item>
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={handleAddCustomSource}
                  style={{ width: '100%' }}
                >
                  添加搜索源
                </Button>
              </Form>
            </div>
          </Space>
        </div>
      </Modal>
      
      {/* 论文详情模态框 */}
      <Modal
        title="论文详情"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="favorite" 
            icon={selectedPaper && favorites.includes(selectedPaper.id) ? <HeartFilled /> : <HeartOutlined />}
            onClick={() => selectedPaper && handleFavorite(selectedPaper.id, favorites.includes(selectedPaper.id))}
          >
            {selectedPaper && favorites.includes(selectedPaper.id) ? '取消收藏' : '收藏'}
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => selectedPaper && handleDownload(selectedPaper)}
          >
            下载论文
          </Button>
        ]}
        width={800}
      >
        {selectedPaper && (
          <div className="paper-details">
            <Title level={4}>{selectedPaper.title}</Title>
            
            <div className="detail-item">
              <Text strong>作者：</Text>
              <Text>{selectedPaper.authors?.join(', ') || '未知'}</Text>
            </div>
            <div className="detail-item">
              <Text strong>发布年份：</Text>
              <Text>{selectedPaper.year || '未知'}</Text>
            </div>
            <div className="detail-item">
              <Text strong>来源：</Text>
              <Tag color={selectedPaper.source === 'arXiv' ? 'blue' : 'green'}>
                {selectedPaper.source || '未知'}
              </Tag>
            </div>
            {selectedPaper.journal && (
              <div className="detail-item">
                <Text strong>期刊：</Text>
                <Text>{selectedPaper.journal}</Text>
              </div>
            )}
            {selectedPaper.conference && (
              <div className="detail-item">
                <Text strong>会议：</Text>
                <Text>{selectedPaper.conference}</Text>
              </div>
            )}
            {selectedPaper.doi && (
              <div className="detail-item">
                <Text strong>DOI：</Text>
                <Text copyable={{ text: selectedPaper.doi }}>{selectedPaper.doi}</Text>
              </div>
            )}
            {selectedPaper.citations && (
              <div className="detail-item">
                <Text strong>引用次数：</Text>
                <Text>{selectedPaper.citations}</Text>
              </div>
            )}
            {selectedPaper.url && (
              <div className="detail-item">
                <Text strong>原文链接：</Text>
                <Button 
                  type="link" 
                  icon={<LinkOutlined />}
                  onClick={() => handleViewOriginal(selectedPaper)}
                >
                  查看原文
                </Button>
              </div>
            )}
            <div className="detail-item">
              <Text strong>摘要：</Text>
              <Paragraph>{selectedPaper.abstract || '暂无摘要'}</Paragraph>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaperSearch;