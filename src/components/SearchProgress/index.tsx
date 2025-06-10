import React from 'react';
import { Progress, Card, Button, Typography, Space, Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { SearchProgress } from '../../services/paperSearchProgressService';

const { Text } = Typography;

interface SearchProgressComponentProps {
  isVisible: boolean;
  progressData: SearchProgress[];
  onCancel: () => void;
}

const SearchProgressComponent: React.FC<SearchProgressComponentProps> = ({
  isVisible,
  progressData,
  onCancel
}) => {
  if (!isVisible) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'searching':
        return 'processing';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'searching':
        return '搜索中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  const overallProgress = progressData.length > 0 
    ? Math.round(progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length)
    : 0;

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <Text strong>搜索进度</Text>
          <Button 
            type="text" 
            size="small" 
            icon={<CloseOutlined />} 
            onClick={onCancel}
            style={{ marginLeft: 'auto' }}
          />
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text>总体进度: {overallProgress}%</Text>
          <Progress percent={overallProgress} size="small" />
        </div>
        
        {progressData.map((item, index) => (
          <div key={index} style={{ marginBottom: 8 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>{item.source}</Text>
              <Tag color={getStatusColor(item.status)}>
                {getStatusText(item.status)}
              </Tag>
            </Space>
            <Progress 
              percent={item.progress} 
              size="small" 
              status={item.status === 'failed' ? 'exception' : undefined}
            />
            {item.message && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {item.message}
              </Text>
            )}
          </div>
        ))}
      </Space>
    </Card>
  );
};

export default SearchProgressComponent;
export type { SearchProgress, SearchProgressComponentProps };