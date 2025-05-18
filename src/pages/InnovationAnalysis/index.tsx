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
    <div style={{ 
      padding: '20px', 
      display: 'flex', 
      justifyContent: 'center',
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <Card 
        title={<div style={{ fontSize: '22px', textAlign: 'center', padding: '10px 0' }}>创新点分析</div>} 
        bordered={false}
        style={{ 
          width: '100%', 
          maxWidth: '1200px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px'
        }}
      >
        <div style={{ 
          width: '100%', 
          maxWidth: '800px', 
          margin: '0 auto 40px',
          padding: '0 20px'
        }}>
          <TextArea 
            placeholder="请输入论文ID或DOI" 
            value={paperId}
            onChange={(e) => setPaperId(e.target.value)}
            style={{ marginBottom: '20px', borderRadius: '8px' }}
            rows={3}
          />
          <Button 
            type="primary" 
            icon={<BulbOutlined />} 
            loading={loading}
            onClick={handleAnalyze}
            size="large"
            style={{ width: '100%', height: '46px', borderRadius: '8px' }}
          >
            分析创新点
          </Button>
        </div>

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 0', 
          color: '#999',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          margin: '0 auto',
          width: '100%',
          maxWidth: '1100px'
        }}>
          <Spin size="large" />
          <p style={{ marginTop: '20px', fontSize: '16px' }}>正在分析论文创新点，请稍候...</p>
        </div>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={innovationPoints}
          style={{ 
            background: '#fff', 
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 20px'
          }}
          renderItem={(item) => (
            <List.Item
              style={{ 
                padding: '24px', 
                marginBottom: '24px', 
                border: '1px solid #f0f0f0', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.3s ease'
              }}
            >
              <Card 
                type="inner" 
                title={<span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>{item.title}</span>}
                style={{ borderRadius: '10px' }}
              >
                <Paragraph style={{ fontSize: '15px', lineHeight: '1.8' }}>
                  <Text strong style={{ fontSize: '15px' }}>描述：</Text> {item.description}
                </Paragraph>
                <Paragraph style={{ fontSize: '15px', lineHeight: '1.8' }}>
                  <Text strong style={{ fontSize: '15px' }}>重要性：</Text> {item.significance}
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
    </div>
  );
};

export default InnovationAnalysis;