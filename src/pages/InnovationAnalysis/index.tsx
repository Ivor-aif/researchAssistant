import React, { useState } from 'react';
import { Card, Input, Button, List, Typography, Spin, message } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { innovationApi } from '../../api';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

interface InnovationPoint {
  id: string;
  title: string;
  description: string;
  significance: string;
  relevance: number; // 相关度评分 1-5
}

const InnovationAnalysis: React.FC = () => {
  const [paperId, setPaperId] = useState('');
  const [loading, setLoading] = useState(false);
  const [innovationPoints, setInnovationPoints] = useState<InnovationPoint[]>([]);

  const handleAnalyze = async () => {
    if (!paperId.trim()) {
      message.warning('请输入论文ID或DOI');
      return;
    }

    setLoading(true);
    try {
      // 调用后端API进行创新点分析
      const response = await innovationApi.analyzeInnovation(paperId);
      setInnovationPoints(response.data || []);
      
      if (response.data?.length === 0) {
        message.info('未能识别出创新点，请检查论文ID是否正确');
      }
    } catch (error) {
      console.error('分析失败:', error);
      message.error('创新点分析失败，请稍后重试');
      // 如果API调用失败，使用模拟数据（仅用于开发测试）
      const mockPoints: InnovationPoint[] = [
        {
          id: '1',
          title: '改进的注意力机制',
          description: '本文提出了一种新的注意力机制，能够更有效地捕捉长距离依赖关系。',
          significance: '该创新点显著提高了模型在长文本处理任务上的性能，比基准模型提升了15%。',
          relevance: 5
        },
        {
          id: '2',
          title: '轻量级模型架构',
          description: '作者设计了一种计算效率更高的模型架构，减少了50%的参数量。',
          significance: '使模型能够在资源受限的设备上运行，同时保持接近大模型的性能。',
          relevance: 4
        }
      ];
      setInnovationPoints(mockPoints);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="创新点分析" bordered={false}>
      <div style={{ marginBottom: 20 }}>
        <TextArea 
          placeholder="请输入论文ID或DOI" 
          value={paperId}
          onChange={(e) => setPaperId(e.target.value)}
          style={{ marginBottom: 10 }}
          rows={2}
        />
        <Button 
          type="primary" 
          icon={<BulbOutlined />} 
          loading={loading}
          onClick={handleAnalyze}
        >
          分析创新点
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <p>正在分析论文创新点，请稍候...</p>
        </div>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={innovationPoints}
          renderItem={(item) => (
            <List.Item>
              <Card type="inner" title={item.title}>
                <Paragraph>
                  <Text strong>描述：</Text> {item.description}
                </Paragraph>
                <Paragraph>
                  <Text strong>重要性：</Text> {item.significance}
                </Paragraph>
                <Paragraph>
                  <Text strong>相关度：</Text> {item.relevance}/5
                </Paragraph>
              </Card>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default InnovationAnalysis;