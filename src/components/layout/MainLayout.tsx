import React from 'react';
import { Layout, Menu } from 'antd';
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

const MainLayout: React.FC = () => {
  const menuItems = [
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
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0, background: '#fff' }}>
        <div style={{ float: 'left', width: 200, height: '100%', padding: '0 1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', lineHeight: '64px' }}>AI 研究助手</h1>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['paper-search']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{
            background: '#fff',
            padding: 24,
            margin: 0,
            minHeight: 280,
            borderRadius: '4px'
          }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;