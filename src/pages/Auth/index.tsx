import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Descriptions, Avatar, Space, Divider, message } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentUser, logout } from '../../services/userService';
import AccountSettings from '../../components/AccountSettings';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout: authLogout } = useAuth();
  const user = getCurrentUser();
  
  // 检查URL参数是否包含settings=true
  const searchParams = new URLSearchParams(location.search);
  const showSettingsParam = searchParams.get('settings') === 'true';
  
  const [showSettings, setShowSettings] = useState(showSettingsParam);

  // 如果用户未登录，重定向到登录页面
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/paper-search');
    }
  }, [isAuthenticated, navigate]);

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

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 30 }}>
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        {!showSettings ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3}>用户信息</Title>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <Avatar 
                size={80} 
                src={user.avatarUrl} 
                icon={!user.avatarUrl && <UserOutlined />} 
              />
            </div>

            <Descriptions bordered column={1}>
              <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
              <Descriptions.Item label="用户ID">{user.id}</Descriptions.Item>
              <Descriptions.Item label="账户状态">已激活</Descriptions.Item>
              <Descriptions.Item label="注册时间">{new Date().toLocaleDateString()}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <Button 
                type="primary" 
                icon={<SettingOutlined />}
                onClick={() => setShowSettings(true)}
              >
                账户设置
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
        ) : (
          <>
            <Button 
              style={{ marginBottom: 16 }} 
              onClick={() => setShowSettings(false)}
            >
              返回用户信息
            </Button>
            <AccountSettings />
          </>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;