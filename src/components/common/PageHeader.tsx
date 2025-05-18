import React from 'react';
import { Typography, Space, Divider } from 'antd';
import theme from '../../theme';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

/**
 * 页面标题组件
 * 用于统一各个页面的标题样式，提供一致的用户体验
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
  return (
    <div style={{ marginBottom: theme.spacing.lg, width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: subtitle ? theme.spacing.sm : theme.spacing.md
      }}>
        <Title 
          level={4} 
          style={{ 
            margin: 0, 
            color: theme.colors.textPrimary,
            fontWeight: theme.typography.fontWeight.medium
          }}
        >
          {title}
        </Title>
        {extra && (
          <Space>
            {extra}
          </Space>
        )}
      </div>
      
      {subtitle && (
        <Text type="secondary" style={{ display: 'block', marginBottom: theme.spacing.md }}>
          {subtitle}
        </Text>
      )}
      
      <Divider style={{ margin: `${theme.spacing.sm} 0 ${theme.spacing.md}` }} />
    </div>
  );
};

export default PageHeader;