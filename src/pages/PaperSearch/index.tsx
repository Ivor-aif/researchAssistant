import React, { useState, useEffect } from 'react';
import { Input, Button, Card, List, Tag, Space, Typography, Skeleton, Select, Checkbox, Empty, Modal, Switch, message, Form } from 'antd';
import { SearchOutlined, HeartOutlined, HeartFilled, DownloadOutlined, InfoCircleOutlined, FileSearchOutlined, SettingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getFavoritePapers, addToFavorites, removeFromFavorites } from '../../services/favoriteService';
import { searchFromMultipleSources } from '../../services/paperSearchService';
import type { Paper as ImportedPaper } from '../../types/paper';
import './style.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

// 扩展导入的Paper接口，添加组件需要的额外字段
interface Paper extends ImportedPaper {
  published_date?: string;
  paper_type?: string;
  // 确保包含ImportedPaper中的必需字段
  url?: string; // 已在ImportedPaper中定义为可选
}

// 自定义搜索源接口
interface CustomSource {
  id: string;
  name: string;
  url: string;
}

const PaperSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [paperTypes, setPaperTypes] = useState<string[]>([]);
  const [selectedPaperTypes, setSelectedPaperTypes] = useState<string[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  // 修改默认搜索源，只启用arXiv
  const [searchSources, setSearchSources] = useState({
    arxiv: true,
    ieee: false,
    springer: false,
    acm: false
  });
  // 添加自定义搜索源状态
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  // 获取论文类型列表
  useEffect(() => {
    // 使用模拟的论文类型列表，因为没有相应的API
    const mockPaperTypes = [
      'Research Paper',
      'Review Article',
      'Conference Paper',
      'Case Study',
      'Technical Report',
      'Thesis',
      'Dissertation'
    ];
    setPaperTypes(mockPaperTypes);
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

  // 处理搜索
  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    setSearchQuery(value);
    setLoading(true);

    try {
      // 记录搜索参数（仅用于调试）
      console.log('搜索参数:', {
        query: value,
        sort_by: sortBy,
        paper_types: selectedPaperTypes.length > 0 ? selectedPaperTypes : undefined,
        sources: searchSources ? Object.entries(searchSources)
          .filter(([_source, enabled]) => enabled)
          .map(([source]) => source) : []
      });

      // 准备搜索源 - 包括内置源和自定义源
      const enabledBuiltinSources = searchSources ? Object.entries(searchSources)
        .filter(([_source, enabled]) => enabled)
        .map(([source]) => ({
          id: source,
          name: source.charAt(0).toUpperCase() + source.slice(1),
          url: `https://${source}.org` // 简单模拟URL
        })) : [];
      
      // 合并内置源和自定义源
      const allSources = [...enabledBuiltinSources, ...(customSources || [])];
      
      if (allSources.length === 0) {
        message.warning('请至少选择一个搜索源');
        setLoading(false);
        return;
      }

      // 使用本地模拟数据，避免调用后端API
      console.log('使用本地模拟数据，不调用后端API');
      const results = await searchFromMultipleSources(value, allSources);
      
      // 确保results是一个有效的数组
      if (Array.isArray(results)) {
        setPapers(results);
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
      
      // 对于演示目的，我们直接使用论文的URL（如果有）
      if (paper.url) {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = paper.url;
        link.target = '_blank';
        link.download = `${paper.title || '未知论文'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('论文下载成功');
      } else {
        // 如果没有URL，显示错误信息
        message.error('无法获取下载链接，该论文可能不提供直接下载');
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
    
    // 这里可以导航到论文详情页面，或者打开一个详情模态框
    console.log('查看论文详情:', paper);
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
  const handleSourceChange = (source: string, checked: boolean) => {
    setSearchSources(prev => ({
      ...prev,
      [source]: checked
    }));
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
      new URL(newSourceUrl); // 检查URL是否有效
    } catch (_e) {
      message.error('请输入有效的URL，包含http://或https://');
      return;
    }
    
    // 检查是否已存在同名源
    const sourceExists = customSources.some(
      source => source.name.toLowerCase() === newSourceName.toLowerCase()
    );
    
    if (sourceExists) {
      message.warning('已存在同名搜索源');
      return;
    }
    
    // 创建新的自定义源
    const newSource: CustomSource = {
      id: `custom-${Date.now()}`,
      name: newSourceName,
      url: newSourceUrl
    };
    
    // 添加到自定义源列表
    setCustomSources([...customSources, newSource]);
    
    // 清空输入框
    setNewSourceName('');
    setNewSourceUrl('');
    
    message.success(`已添加搜索源: ${newSourceName}`);
  };
  
  // 删除自定义搜索源
  const handleRemoveCustomSource = (sourceId: string) => {
    setCustomSources(customSources.filter(source => source.id !== sourceId));
    message.success('已删除搜索源');
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
            论文搜索
          </div>
        } 
        bordered={false}
        className="paper-search-card"
        extra={<Button icon={<SettingOutlined />} onClick={() => setSettingsVisible(true)}>搜索设置</Button>}
      >
        <div className="search-form">
          <Search
            placeholder="输入关键词、标题或作者进行搜索"
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
            size="large"
            onSearch={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <Title level={5} className="filter-title">筛选条件</Title>
          <div className="filter-item">
            <Text strong>论文类型：</Text>
            <Checkbox.Group
              options={paperTypes && Array.isArray(paperTypes) ? paperTypes.map(type => ({ label: type, value: type })) : []}
              value={selectedPaperTypes}
              onChange={handlePaperTypeChange}
            />
          </div>
        </div>

        <div className="results-header">
          <Title level={4}>{papers.length > 0 ? `搜索结果 (${papers.length})` : '搜索结果'}</Title>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            className="sort-select"
          >
            <Option value="relevance">按相关度排序</Option>
            <Option value="date_desc">按日期排序（最新）</Option>
            <Option value="date_asc">按日期排序（最早）</Option>
            <Option value="citations_desc">按引用次数排序</Option>
          </Select>
        </div>

        {loading ? (
          <List
            itemLayout="vertical"
            dataSource={Array(5).fill(null)}
            renderItem={() => (
              <List.Item>
                <Skeleton active avatar={false} title paragraph={{ rows: 4 }} />
              </List.Item>
            )}
            className="paper-list"
          />
        ) : papers && Array.isArray(papers) && papers.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={papers && Array.isArray(papers) ? papers.filter(paper => paper && typeof paper === 'object') : []}
            renderItem={paper => {
              // 确保paper.id存在
              const paperId = paper?.id || '';
              const isFavorite = !!(paperId && favorites.includes(paperId));
              
              return (
                <List.Item
                  className="paper-item"
                  actions={[
                    <Button 
                      icon={isFavorite ? <HeartFilled /> : <HeartOutlined />} 
                      onClick={() => paperId && handleFavorite(paperId, isFavorite)}
                      className={`action-button favorite-button ${isFavorite ? 'favorited' : ''}`}
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
                      icon={<InfoCircleOutlined />} 
                      onClick={() => handleViewDetails(paper)}
                      className="action-button details-button"
                    >
                      详情
                    </Button>
                  ]}
                >
                  <Title level={5} className="paper-title">{paper.title || '未知标题'}</Title>
                  <div className="paper-meta">
                    <Text>作者: {paper.authors && Array.isArray(paper.authors) ? paper.authors.join(', ') : '未知'}</Text>
                    <br />
                    <Text>发布年份: {paper.year || '未知'}</Text>
                    <br />
                    <Text>来源: {paper.source || '未知'}</Text>
                  </div>
                  <Paragraph ellipsis={{ rows: 3 }} className="paper-abstract">
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
              image={<SearchOutlined className="empty-icon" />}
              description="未找到相关论文，请尝试其他关键词"
            />
          </div>
        ) : null}
      </Card>

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
            <div>
              <Switch checked={searchSources.arxiv} onChange={(checked) => handleSourceChange('arxiv', checked)} />
              <Text style={{ marginLeft: 8 }}>arXiv</Text>
            </div>
            <div>
              <Switch checked={searchSources.ieee} onChange={(checked) => handleSourceChange('ieee', checked)} />
              <Text style={{ marginLeft: 8 }}>IEEE Xplore</Text>
            </div>
            <div>
              <Switch checked={searchSources.springer} onChange={(checked) => handleSourceChange('springer', checked)} />
              <Text style={{ marginLeft: 8 }}>Springer</Text>
            </div>
            <div>
              <Switch checked={searchSources.acm} onChange={(checked) => handleSourceChange('acm', checked)} />
              <Text style={{ marginLeft: 8 }}>ACM Digital Library</Text>
            </div>
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
    </div>
  );
};

export default PaperSearch;