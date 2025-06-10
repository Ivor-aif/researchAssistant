import React from 'react';
import { Progress, Card, Typography, Space, Tag } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { SearchProgress as SearchProgressType } from '../services/paperSearchProgressService';

const { Text } = Typography;

interface SearchProgressProps {
  progress: SearchProgressType | null;
  isSearching: boolean;
  onCancel?: () => void;
}

const SearchProgressComponent: React.FC<SearchProgressProps> = ({
  progress,
  isSearching,
  onCancel
}) => {
  if (!isSearching && !progress) {
    return null;
  }

  const getStatusIcon = () => {
    if (!progress) {
      return <LoadingOutlined style={{ fontSize: 16, color: '#1890ff' }} />;
    }

    switch (progress.type) {
      case 'complete':
        return <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />;
      default:
        return <LoadingOutlined style={{ fontSize: 16, color: '#1890ff' }} />;
    }
  };

  const getStatusColor = () => {
    if (!progress) return 'normal';
    
    switch (progress.type) {
      case 'complete':
        return 'success';
      case 'error':
        return 'exception';
      default:
        return 'active';
    }
  };

  const getProgressText = () => {
    if (!progress) {
      return '正在初始化搜索...';
    }

    if (progress.type === 'complete') {
      return `搜索完成！共找到 ${progress.total_found || 0} 篇论文`;
    }

    if (progress.type === 'error') {
      return progress.message || '搜索失败';
    }

    return progress.message || '正在搜索...';
  };

  const renderProgressStats = () => {
    if (!progress || progress.type === 'error') {
      return null;
    }

    const current = progress.current || 0;
    const total = progress.total || 0;
    const papersFound = progress.papers_found || 0;
    const remaining = Math.max(0, total - current);

    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space wrap>
          <Tag color="blue" icon={<LoadingOutlined />}>
            当前进度: {current}/{total}
          </Tag>
          <Tag color="green">
            已找到: {papersFound} 篇论文
          </Tag>
          {remaining > 0 && (
            <Tag color="orange">
              剩余: {remaining} 个网站
            </Tag>
          )}
        </Space>
      </Space>
    );
  };

  return (
    <Card 
      size="small" 
      style={{ 
        marginBottom: 16,
        border: progress?.type === 'error' ? '1px solid #ff4d4f' : '1px solid #d9d9d9'
      }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* 状态标题 */}
        <Space align="center">
          {getStatusIcon()}
          <Text strong style={{ 
            color: progress?.type === 'error' ? '#ff4d4f' : 
                   progress?.type === 'complete' ? '#52c41a' : '#1890ff'
          }}>
            {getProgressText()}
          </Text>
          {isSearching && onCancel && (
            <a 
              onClick={onCancel}
              style={{ marginLeft: 'auto', color: '#ff4d4f' }}
            >
              取消搜索
            </a>
          )}
        </Space>

        {/* 进度条 */}
        {progress && progress.type !== 'error' && (
          <Progress
            percent={progress.percentage || 0}
            status={getStatusColor()}
            size="small"
            showInfo={true}
            format={(percent) => `${percent}%`}
          />
        )}

        {/* 统计信息 */}
        {renderProgressStats()}

        {/* 错误信息 */}
        {progress?.type === 'error' && (
          <Text type="danger" style={{ fontSize: '12px' }}>
            {progress.message}
          </Text>
        )}
      </Space>
    </Card>
  );
};

export default SearchProgressComponent;