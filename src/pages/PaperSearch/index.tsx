import React, { useState } from 'react';
import { Input, Card, List, Tag, Space, Typography, Button, message, Tooltip } from 'antd';
import { SearchOutlined, DownloadOutlined, StarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { paperApi } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import theme from '../../theme';

const { Search } = Input;
const { Text } = Typography;

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  year: number;
  journal: string;
  citations: number;
}

const PaperSearch: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }
    
    setSearchKeyword(value);
    setLoading(true);
    try {
      // 调用后端API进行论文检索
      const response = await paperApi.searchPapers(value);
      setPapers(response.data || []);
      
      // 如果没有搜索结果，显示提示
      if (response.data?.length === 0) {
        message.info('未找到相关论文，请尝试其他关键词');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('论文检索失败，请稍后重试');
      // 如果API调用失败，使用模拟数据（仅用于开发测试）
      const mockPapers: Paper[] = [
        {
          id: '1',
          title: '深度学习在自然语言处理中的应用',
          authors: ['张三', '李四', '王五'],
          abstract: '本文探讨了深度学习技术在自然语言处理领域的最新应用...',
          keywords: ['深度学习', 'NLP', '人工智能'],
          year: 2023,
          journal: '计算机科学与技术',
          citations: 156
        }
      ];
      setPapers(mockPapers);
    } finally {
      setLoading(false);
    }
  };

  // 页面额外操作按钮
  const pageHeaderExtra = (
    <Tooltip title="查看使用帮助">
      <Button type="text" icon={<InfoCircleOutlined />}>帮助</Button>
    </Tooltip>
  );

  return (
    <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader 
        title="论文检索" 
        subtitle={searchKeyword ? `当前搜索: ${searchKeyword}` : "输入关键词搜索相关研究论文"}
        extra={pageHeaderExtra}
      />
      
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
                  <Button type="text" icon={<StarOutlined />} key="favorite">收藏</Button>,
                  <Button type="primary" ghost icon={<DownloadOutlined />} key="download">下载</Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space direction="vertical" size={theme.spacing.sm}>
                      <Text strong style={{ fontSize: theme.typography.fontSize.lg, color: theme.colors.primary }}>{paper.title}</Text>
                      <Space size={[0, 8]} wrap>
                        {paper.keywords.map(keyword => (
                          <Tag color="blue" key={keyword}>{keyword}</Tag>
                        ))}
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