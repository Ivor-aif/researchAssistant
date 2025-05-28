import React, { useState, useEffect } from 'react';
import { Input, Card, List, Tag, Space, Typography, Button, message, Tooltip, Modal, Form, Switch, Select, Divider } from 'antd';
import { SearchOutlined, DownloadOutlined, StarOutlined, InfoCircleOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { paperApi } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import theme from '../../theme';
import { usePaperSearch } from '../../contexts/PaperSearchContext';
import { searchFromMultipleSources } from '../../services/paperSearchService';
import type { Paper } from '../../types/paper';
import { toggleFavorite, loadFavoriteStatus } from '../../services/favoriteService';

const { Search } = Input;
const { Text } = Typography;

const PaperSearch: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [newSourceForm] = Form.useForm();
  
  // 收藏论文
  const handleFavoritePaper = (paper: Paper) => {
    // 使用收藏服务切换收藏状态
    const success = toggleFavorite(paper);
    
    if (success) {
      // 更新本地状态
      setPapers(prevPapers => 
        prevPapers.map(p => 
          p.id === paper.id 
            ? { ...p, isFavorite: !p.isFavorite } 
            : p
        )
      );
    }
  };
  
  // 下载论文
  const handleDownloadPaper = (paper: Paper) => {
    if (!paper.url) {
      message.error('无法下载，论文链接不存在');
      return;
    }
    
    // 打开论文链接进行下载
    window.open(paper.url, '_blank');
    message.success('正在准备下载论文...');
  };
  
  // 使用论文检索上下文
  const { 
    searchSources, 
    activeSearchSources, 
    defaultSearchSource,
    addSearchSource, 
    updateSearchSource, 
    removeSearchSource, 
    toggleSearchSource 
  } = usePaperSearch();

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }
    
    console.log('🔍 开始搜索论文，关键词:', value);
    console.log('🔍 活跃的搜索源:', activeSearchSources);
    
    setSearchKeyword(value);
    setLoading(true);
    try {
      // 使用新的服务从多个源搜索论文
      console.log('🔍 调用searchFromMultipleSources函数');
      const results = await searchFromMultipleSources(value, activeSearchSources);
      console.log('🔍 搜索结果:', results);
      
      // 加载收藏状态
      console.log('🔍 加载收藏状态');
      const resultsWithFavoriteStatus = loadFavoriteStatus(results);
      console.log('🔍 带收藏状态的结果:', resultsWithFavoriteStatus);
      setPapers(resultsWithFavoriteStatus);
      
      // 如果没有搜索结果，显示提示
      if (results.length === 0) {
        message.info('未找到相关论文，请尝试其他关键词或更改搜索源');
      } else {
        message.success(`找到 ${results.length} 篇相关论文`);
      }
    } catch (error: any) {
      console.error('搜索失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '论文检索失败，请稍后重试';
      
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
      setTimeout(() => {
        message.error(`搜索失败: ${errorMessage}`);
      }, 100);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理添加新搜索源
  const handleAddSource = (values: any) => {
    addSearchSource({
      name: values.name,
      url: values.url,
      isActive: true
    });
    newSourceForm.resetFields();
  };
  
  // 打开设置模态框
  const openSettings = () => {
    setSettingsVisible(true);
  };
  
  // 关闭设置模态框
  const closeSettings = () => {
    setSettingsVisible(false);
  };

  // 页面额外操作按钮
  const pageHeaderExtra = (
    <Space>
      <Tooltip title="搜索源设置">
        <Button type="text" icon={<SettingOutlined />} onClick={openSettings}>设置</Button>
      </Tooltip>
      <Tooltip title="查看使用帮助">
        <Button type="text" icon={<InfoCircleOutlined />}>帮助</Button>
      </Tooltip>
    </Space>
  );

  return (
    <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader 
        title="论文检索" 
        subtitle={
          searchKeyword 
            ? `当前搜索: ${searchKeyword} ${activeSearchSources.length > 0 ? `(来源: ${activeSearchSources.map(s => s.name).join(', ')})` : ''}` 
            : "输入关键词搜索相关研究论文"
        }
        extra={pageHeaderExtra}
      />
      
      {/* 搜索源设置模态框 */}
      <Modal
        title="论文检索设置"
        open={settingsVisible}
        onCancel={closeSettings}
        footer={[
          <Button key="close" onClick={closeSettings}>关闭</Button>
        ]}
        width={600}
      >
        <Typography.Title level={5}>搜索源配置</Typography.Title>
        <Typography.Paragraph type="secondary">
          选择要使用的论文检索源。默认使用arXiv，您也可以添加其他学术网站。
        </Typography.Paragraph>
        
        <List
          dataSource={searchSources}
          renderItem={source => (
            <List.Item
              actions={[
                <Switch 
                  checked={source.isActive} 
                  onChange={() => toggleSearchSource(source.id)}
                />,
                source.id !== 'arxiv' && (
                  <Button 
                    danger 
                    type="text" 
                    onClick={() => removeSearchSource(source.id)}
                  >
                    删除
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                title={source.name}
                description={source.url}
              />
            </List.Item>
          )}
        />
        
        <Divider>添加新搜索源</Divider>
        
        <Form
          form={newSourceForm}
          layout="vertical"
          onFinish={handleAddSource}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入搜索源名称' }]}
          >
            <Input placeholder="例如: IEEE Xplore" />
          </Form.Item>
          
          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, message: '请输入搜索源URL' }]}
          >
            <Input placeholder="例如: https://ieeexplore.ieee.org/search/searchresult.jsp" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              添加搜索源
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      <Card 
        style={{ 
          marginBottom: theme.spacing.lg,
          boxShadow: theme.shadows.sm,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderColor}`,
          width: '100%',
          flex: '0 0 auto'
        }}
        bodyStyle={{ padding: theme.spacing.md, width: '100%' }}
      >
        <Search
          placeholder="输入关键词搜索论文"
          enterButton={<><SearchOutlined /> 搜索</>}
          size="large"
          loading={loading}
          onSearch={handleSearch}
          style={{ width: '100%' }}
        />
      </Card>

      {papers.length > 0 && (
        <Card 
          style={{ 
            boxShadow: theme.shadows.sm,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderColor}`,
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
          bodyStyle={{ padding: 0, width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <List
            style={{ width: '100%', flex: 1 }}
            dataSource={papers}
            renderItem={paper => (
              <List.Item
                key={paper.id}
                style={{ 
                  padding: theme.spacing.md,
                  borderBottom: `1px solid ${theme.colors.dividerColor}`,
                  transition: `background-color ${theme.transitions.normal}`,
                  '&:hover': { backgroundColor: 'rgba(24, 144, 255, 0.05)' }
                }}
                actions={[
                  <Button 
                    type="text" 
                    icon={<StarOutlined />} 
                    key="favorite"
                    onClick={() => handleFavoritePaper(paper)}
                    style={{ color: paper.isFavorite ? theme.colors.warning : undefined }}
                  >
                    {paper.isFavorite ? '已收藏' : '收藏'}
                  </Button>,
                  <Button 
                    type="primary" 
                    ghost 
                    icon={<DownloadOutlined />} 
                    key="download"
                    onClick={() => handleDownloadPaper(paper)}
                    disabled={!paper.url}
                  >
                    下载
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space direction="vertical" size={theme.spacing.sm}>
                      {paper.url ? (
                        <a href={paper.url} target="_blank" rel="noopener noreferrer">
                          <Text strong style={{ fontSize: theme.typography.fontSize.lg, color: theme.colors.primary }}>{paper.title}</Text>
                        </a>
                      ) : (
                        <Text strong style={{ fontSize: theme.typography.fontSize.lg, color: theme.colors.primary }}>{paper.title}</Text>
                      )}
                      <Space size={[0, 8]} wrap>
                        {paper.keywords.map(keyword => (
                          <Tag color="blue" key={keyword}>{keyword}</Tag>
                        ))}
                        {paper.source && <Tag color="green">{paper.source}</Tag>}
                      </Space>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={theme.spacing.sm} style={{ marginTop: theme.spacing.sm }}>
                      <Text type="secondary">作者: {paper.authors.join(', ')}</Text>
                      <Text type="secondary">{paper.journal} ({paper.year}) | 引用次数: {paper.citations}</Text>
                      <Text style={{ color: theme.colors.textPrimary }}>{paper.abstract}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
      
      {papers.length === 0 && !loading && searchKeyword && (
        <Card
          style={{ 
            textAlign: 'center', 
            padding: theme.spacing.xl,
            boxShadow: theme.shadows.sm,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderColor}`,
            width: '100%',
            flex: 1
          }}
        >
          <Text type="secondary" style={{ fontSize: theme.typography.fontSize.md }}>
            未找到相关论文，请尝试其他关键词
          </Text>
        </Card>
      )}
    </div>
  );
};

export default PaperSearch;