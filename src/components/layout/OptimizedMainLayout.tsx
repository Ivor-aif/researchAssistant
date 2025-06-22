import React, { lazy, Suspense, useMemo } from 'react';
import { Layout, Menu, Spin, Typography, Avatar, Space, Divider, Dropdown, Button, Badge } from 'antd';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FileSearchOutlined,
  BulbOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  UserOutlined,
  RobotOutlined,
  LogoutOutlined,
  LoginOutlined,
  SettingOutlined,
  BellOutlined,
  GithubOutlined,
  GitlabOutlined,
  HeartOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { getUnreadCount } from '../../services/messageService';

const { Header, Content, Sider, Footer } = Layout;
const { Title, Text } = Typography;

// 使用React.memo包装纯展示型组件
const AppHeader = React.memo(() => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // 加载未读消息数量
  React.useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('获取未读消息数量失败:', error);
      }
    };
    
    if (isAuthenticated) {
      loadUnreadCount();
      // 每30秒刷新一次未读数量
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '用户信息',
      onClick: () => navigate('/auth')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: () => {
        navigate('/auth?settings=true');
      }
    },
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
      background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar 
          icon={<RobotOutlined />} 
          style={{ 
            backgroundColor: '#fff', 
            color: '#1890ff', 
            marginRight: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }} 
          size={40} 
        />
        <Title level={4} style={{ margin: 0, color: '#fff' }}>AI 研究助手</Title>
      </div>
      <Space size="large">
        <Badge count={unreadCount} size="small">
          <Button 
            type="text" 
            icon={<BellOutlined />} 
            style={{ color: '#fff', fontSize: '18px' }}
            onClick={() => navigate('/auth?messages=true')}
          />
        </Badge>
        {isAuthenticated ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ 
                backgroundColor: '#f56a00',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}>
                {user?.username.charAt(0).toUpperCase()}
              </Avatar>
              <Typography.Text style={{ color: '#fff', fontWeight: 500 }}>{user?.username}</Typography.Text>
            </Space>
          </Dropdown>
        ) : (
          <Button 
            type="primary" 
            icon={<LoginOutlined />} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#fff',
              fontWeight: 500
            }}
            onClick={() => navigate('/auth')}
          >
            登录
          </Button>
        )}
      </Space>
    </Header>
  );
});

const OptimizedMainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 获取当前活动的菜单项
  const activeMenuItem = location.pathname.split('/')[1] || 'paper-search';
  
  // 使用useMemo缓存菜单项配置
  const menuItems = useMemo(() => [
    {
      key: 'paper-search',
      icon: <FileSearchOutlined />,
      label: <Link to="/paper-search">论文检索</Link>
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <Link to="/favorites">我的收藏</Link>
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
    },
    {
      key: 'ai-config',
      icon: <ApiOutlined />,
      label: <Link to="/ai-config">AI配置</Link>
    },
    {
      key: 'auth',
      icon: <UserOutlined />,
      label: <Link to="/auth">个人中心</Link>
    }
  ], []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Layout>
        <Sider 
          width={220} 
          style={{ 
            background: '#fff',
            boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
            zIndex: 10,
            height: '100%',
            position: 'sticky',
            left: 0,
            top: 64,
            overflow: 'auto'
          }}
          breakpoint="lg"
          collapsedWidth={0}
        >
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>研究工具</Text>
          </div>
          <Divider style={{ margin: '0 0 8px 0' }} />
          <Menu
            mode="inline"
            selectedKeys={[activeMenuItem]}
            style={{ 
              borderRight: 0,
              padding: '8px 0'
            }}
            items={menuItems}
          />
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button 
                type="text" 
                icon={<GithubOutlined />} 
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => window.open('https://github.com/Ivor-aif/researchAssistant', '_blank')}
              >
                GitHub
              </Button>
              <Button 
                type="text" 
                icon={<GitlabOutlined />} 
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => window.open('https://gitee.com/ivoraif/researchAssistant', '_blank')}
              >
                Gitee
              </Button>
              <Text type="secondary" style={{ fontSize: '12px' }}>版本: v1.0.0</Text>
            </Space>
          </div>
        </Sider>
        <Content style={{
          padding: '24px',
          margin: 0,
          minHeight: 'calc(100vh - 64px - 48px)',
          background: '#f0f2f5',
          overflowX: 'hidden'
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            minHeight: 'calc(100vh - 64px - 48px - 48px)',
            animation: 'optimizedFadeIn 0.25s ease-out'
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
      </Layout>
      <Footer style={{ 
        textAlign: 'center', 
        background: '#f0f2f5', 
        padding: '12px 50px',
        height: '48px'
      }}>
        <Text type="secondary">AI 研究助手 ©{new Date().getFullYear()} 版权所有</Text>
      </Footer>
    </Layout>
  );
};

export default OptimizedMainLayout;