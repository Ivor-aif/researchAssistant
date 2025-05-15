import React, { lazy, Suspense, useMemo, useCallback } from 'react';
import { Layout, Menu, Spin } from 'antd';
import { Link, Outlet } from 'react-router-dom';
import {
  FileSearchOutlined,
  BulbOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

// 使用React.memo包装纯展示型组件
const AppHeader = React.memo(() => (
  <Header style={{ padding: 0, background: '#fff' }}>
    <div style={{ float: 'left', width: 200, height: '100%', padding: '0 1rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.2rem', lineHeight: '64px' }}>AI 研究助手</h1>
    </div>
  </Header>
));

// 使用React.memo优化侧边栏菜单
const SideMenu = React.memo(({ menuItems, defaultSelectedKey }: { menuItems: any[], defaultSelectedKey: string }) => (
  <Sider width={200} style={{ background: '#fff' }}>
    <Menu
      mode="inline"
      defaultSelectedKeys={[defaultSelectedKey]}
      style={{ height: '100%', borderRight: 0 }}
      items={menuItems}
    />
  </Sider>
));

// 使用React.memo优化内容区域
const ContentArea = React.memo(() => (
  <Content style={{
    background: '#fff',
    padding: 24,
    margin: 0,
    minHeight: 280,
    borderRadius: '4px'
  }}>
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}><Spin size="large" /></div>}>
      <Outlet />
    </Suspense>
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
      <Layout>
        <SideMenu menuItems={menuItems} defaultSelectedKey="paper-search" />
        <Layout style={{ padding: '24px' }}>
          <ContentArea />
        </Layout>
      </Layout>
    </Layout>
  );
};

// 使用React.memo包装整个组件
export default React.memo(OptimizedMainLayout);