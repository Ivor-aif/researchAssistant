import React, { useState } from 'react';
import { Input, Card, List, Tag, Space, Typography, Button, message } from 'antd';
import { SearchOutlined, DownloadOutlined, StarOutlined } from '@ant-design/icons';
import { paperApi } from '../../api';

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

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }
    
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
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="论文检索" bordered={false}>
        <Search
          placeholder="输入关键词、标题或作者进行搜索"
          enterButton={<SearchOutlined />}
          size="large"
          loading={loading}
          onSearch={handleSearch}
        />

        <List
          itemLayout="vertical"
          size="large"
          dataSource={papers}
          renderItem={(paper) => (
            <List.Item
              key={paper.id}
              actions={[
                <Button icon={<DownloadOutlined />} key="download">下载</Button>,
                <Button icon={<StarOutlined />} key="favorite">收藏</Button>
              ]}
            >
              <List.Item.Meta
                title={<a href="#">{paper.title}</a>}
                description={
                  <Space direction="vertical">
                    <Space>
                      <Text type="secondary">作者：</Text>
                      {paper.authors.join(', ')}
                    </Space>
                    <Space>
                      <Text type="secondary">期刊：</Text>
                      {paper.journal}
                    </Space>
                    <Space>
                      <Text type="secondary">年份：</Text>
                      {paper.year}
                    </Space>
                    <Space>
                      <Text type="secondary">被引用次数：</Text>
                      {paper.citations}
                    </Space>
                    <Space>
                      {paper.keywords.map((keyword) => (
                        <Tag key={keyword} color="blue">{keyword}</Tag>
                      ))}
                    </Space>
                  </Space>
                }
              />
              <div>{paper.abstract}</div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default PaperSearch;