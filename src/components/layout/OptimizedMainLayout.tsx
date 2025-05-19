import React, { lazy, Suspense, useMemo, useCallback } from 'react';
import { Layout, Menu, Spin, Typography, Avatar, Space, Divider, Dropdown, Button } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  FileSearchOutlined,
  BulbOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  UserOutlined,
  RobotOutlined,
  LogoutOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Content, Sider, Footer } = Layout;
const { Title, Text } = Typography;

// 使用React.memo包装纯展示型组件
const AppHeader = React.memo(() => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];
  
  return (
  <Header style={{ 
    padding: '0 24px', 
    background: '#1890ff', 
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Avatar 
        icon={<RobotOutlined />} 
        style={{ backgroundColor: '#fff', color: '#1890ff', marginRight: 12 }} 
        size={40} 
      />
      <Title level={4} style={{ margin: 0, color: '#fff' }}>AI 研究助手</Title>
    </div>
    <Space>
      {isAuthenticated ? (
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar style={{ backgroundColor: '#f56a00' }}>
              {user?.username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography.Text style={{ color: '#fff' }}>{user?.username}</Typography.Text>
          </Space>
        </Dropdown>
      ) : (
        <Button 
          type="link" 
          icon={<LoginOutlined />} 
          style={{ color: '#fff' }}
          onClick={() => navigate('/auth')}
        >
          登录
        </Button>
      )}
    </Space>
  </Header>
);
});

// 使用React.memo优化侧边栏菜单
const SideMenu = React.memo(({ menuItems, defaultSelectedKey }: { menuItems: any[], defaultSelectedKey: string }) => (
  <Sider 
    width={220} 
    style={{ 
      background: '#fff',
      boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
      zIndex: 10,
      height: '100%',
      overflow: 'auto'
    }}
  >
    <div style={{ padding: '16px 0', textAlign: 'center' }}>
      <Text type="secondary" style={{ fontSize: '12px' }}>研究工具</Text>
    </div>
    <Divider style={{ margin: '0 0 8px 0' }} />
    <Menu
      mode="inline"
      defaultSelectedKeys={[defaultSelectedKey]}
      style={{ 
        height: 'calc(100% - 60px)', 
        borderRight: 0,
        padding: '8px 0'
      }}
      items={menuItems}
    />
  </Sider>
));

// 使用React.memo优化内容区域
const ContentArea = React.memo(() => (
  <Content style={{
    padding: '24px',
    margin: 0,
    minHeight: 'calc(100vh - 64px - 48px)',
    borderRadius: '8px',
    background: '#f0f2f5',
    width: '100%', // 确保内容区域占满可用宽度
    flex: 1, // 添加弹性布局，使内容区域自动填充可用空间
    display: 'flex', // 添加弹性布局
    flexDirection: 'column', // 设置垂直方向布局
    overflow: 'auto' // 添加滚动条，防止内容溢出
  }}>
    <div style={{
      background: '#fff',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      minHeight: 'calc(100vh - 64px - 48px - 48px)',
      width: '100%', // 确保内容容器占满父元素宽度
      flex: 1, // 添加弹性布局，使内容区域自动填充可用空间
      display: 'flex', // 添加弹性布局
      flexDirection: 'column', // 设置垂直方向布局
      overflow: 'auto' // 添加滚动条，防止内容溢出
    }}>
      <Suspense fallback={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%', 
          padding: '40px' 
        }}>
          <Spin size="large" tip="加载中..." />
        </div>
      }>
        <Outlet />
      </Suspense>
    </div>
  </Content>
));

const OptimizedMainLayout: React.FC = () => {
  // 使用useMemo缓存菜单项配置
  const menuItems = useMemo(() => [
    {
      key: 'auth',
      icon: <UserOutlined />,
      label: <Link to="/auth">用户认证</Link>
    },
    {
      key: 'paper-search',
      icon: <FileSearchOutlined />,
      label: <Link to="/paper-search">论文检索</Link>
    },
    {
      key: 'innovation-analysis',
      icon: <BulbOutlined />,
      label: <Link to="/innovation-analysis">创新点分析</Link>
    },
    {
      key: 'research-progress',
      icon: <BarChartOutlined />,
      label: <Link to="/research-progress">研究进度</Link>
    },
    {
      key: 'paper-reproduction',
      icon: <ExperimentOutlined />,
      label: <Link to="/paper-reproduction">论文复现</Link>
    },
    {
      key: 'report',
      icon: <FileTextOutlined />,
      label: <Link to="/report">报告生成</Link>
    }
  ], []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Layout style={{ display: 'flex', flexDirection: 'row', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <SideMenu menuItems={menuItems} defaultSelectedKey="paper-search" />
        <Layout style={{ background: '#f0f2f5', flex: 1, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ContentArea />
          <Footer style={{ 
            textAlign: 'center', 
            background: '#f0f2f5', 
            padding: '12px 50px',
            height: '48px'
          }}>
            <Text type="secondary">AI 研究助手 ©{new Date().getFullYear()} 版权所有</Text>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

// 使用React.memo包装整个组件
export default React.memo(OptimizedMainLayout);