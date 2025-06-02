import React, { useState, useEffect } from 'react';
import { Input, Button, Card, List, Tag, Space, Typography, Skeleton, Select, Checkbox, Empty, Modal, Switch, message } from 'antd';
import { SearchOutlined, HeartOutlined, HeartFilled, DownloadOutlined, InfoCircleOutlined, FileSearchOutlined, SettingOutlined } from '@ant-design/icons';
import { paperApi } from '../../api';
import { getFavoritePapers, addToFavorites, removeFromFavorites } from '../../services/favoriteService';
import { searchFromMultipleSources } from '../../services/paperSearchService';
import './style.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  url: string;
  published_date: string;
  source: string;
  paper_type: string;
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
  const [searchSources, setSearchSources] = useState({
    arxiv: true,
    ieee: true,
    springer: true,
    acm: true
  });

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
    setFavorites(favoritePapers.map(paper => paper.id));
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
      // 准备搜索参数
      const searchParams = {
        query: value,
        sort_by: sortBy,
        paper_types: selectedPaperTypes.length > 0 ? selectedPaperTypes : undefined,
        sources: Object.entries(searchSources)
          .filter(([_, enabled]) => enabled)
          .map(([source]) => source)
      };

      // 准备搜索源
      const sources = Object.entries(searchSources)
        .filter(([_, enabled]) => enabled)
        .map(([source]) => ({
          id: source,
          name: source.charAt(0).toUpperCase() + source.slice(1),
          url: `https://${source}.org` // 简单模拟URL
        }));

      // 调用搜索服务
      const results = await searchFromMultipleSources(value, sources);
      setPapers(results);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理收藏/取消收藏
  const handleFavorite = async (paperId: string, isFavorite: boolean) => {
    try {
      // 找到对应的论文
      const paper = papers.find(p => p.id === paperId);
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
        link.download = `${paper.title}.pdf`;
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
              options={paperTypes.map(type => ({ label: type, value: type }))}
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
        ) : papers.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={papers}
            renderItem={paper => {
              const isFavorite = favorites.includes(paper.id);
              
              return (
                <List.Item
                  className="paper-item"
                  actions={[
                    <Button 
                      icon={isFavorite ? <HeartFilled /> : <HeartOutlined />} 
                      onClick={() => handleFavorite(paper.id, isFavorite)}
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
                  <Title level={5} className="paper-title">{paper.title}</Title>
                  <div className="paper-meta">
                    <Text>作者: {paper.authors.join(', ')}</Text>
                    <br />
                    <Text>发布日期: {paper.published_date}</Text>
                    <br />
                    <Text>来源: {paper.source}</Text>
                  </div>
                  <Paragraph ellipsis={{ rows: 3 }} className="paper-abstract">
                    {paper.abstract}
                  </Paragraph>
                  <div className="paper-keywords">
                    {paper.keywords.map((keyword, index) => (
                      <Tag key={index} color="blue" className="keyword-tag">{keyword}</Tag>
                    ))}
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
          <Space direction="vertical">
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
      </Modal>
    </div>
  );
};

export default PaperSearch;