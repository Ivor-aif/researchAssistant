import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Descriptions, Avatar, Space, Divider, message, Tabs, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentUser, logout } from '../../services/userService';
import { getUnreadCount } from '../../services/messageService';
import AccountSettings from '../../components/AccountSettings';
import Messages from '../Messages';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout: authLogout } = useAuth();
  const user = getCurrentUser();
  
  // 检查URL参数
  const searchParams = new URLSearchParams(location.search);
  const showSettingsParam = searchParams.get('settings') === 'true';
  const showMessagesParam = searchParams.get('messages') === 'true';
  
  const [activeTab, setActiveTab] = useState(() => {
    if (showSettingsParam) return 'settings';
    if (showMessagesParam) return 'messages';
    return 'profile';
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // 如果用户未登录，重定向到登录页面
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/paper-search');
    }
  }, [isAuthenticated, navigate]);

  // 加载未读消息数量
  useEffect(() => {
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

  // 处理退出登录
  const handleLogout = () => {
    if (logout()) {
      authLogout(); // 更新认证上下文
      navigate('/paper-search');
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: 450, margin: '0 auto', paddingTop: 30 }}>
        <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text>加载用户信息中...</Text>
          </div>
        </Card>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          用户信息
        </span>
      ),
      children: (
        <>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <Avatar 
                size={80} 
                src={user?.avatarUrl} 
                icon={!user?.avatarUrl && <UserOutlined />} 
              />
            </div>
          </div>

          <Descriptions bordered column={1}>
            <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{user?.id}</Descriptions.Item>
            <Descriptions.Item label="账户状态">已激活</Descriptions.Item>
            <Descriptions.Item label="注册时间">{new Date().toLocaleDateString()}</Descriptions.Item>
          </Descriptions>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Button 
              type="primary" 
              icon={<SettingOutlined />}
              onClick={() => setActiveTab('settings')}
            >
              账户设置
            </Button>
            <Button 
              icon={<BellOutlined />}
              onClick={() => setActiveTab('messages')}
            >
              消息中心
              {unreadCount > 0 && (
                <Badge count={unreadCount} size="small" style={{ marginLeft: 8 }} />
              )}
            </Button>
            <Button 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </div>
        </>
      )
    },
    {
      key: 'messages',
      label: (
        <span>
          <BellOutlined />
          消息中心
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: <Messages />
    },
    {
      key: 'settings',
      label: (
        <span>
          <SettingOutlined />
          账户设置
        </span>
      ),
      children: <AccountSettings />
    }
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingTop: 30 }}>
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>个人中心</Title>
        </div>
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        />
      </Card>
    </div>
  );
};

export default UserProfile;
