import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginFormData) => {
    try {
      setLoading(true);
      console.log('Login.onFinish - 开始登录，用户名:', values.email);
      console.log('Login.onFinish - 环境变量:', {
        API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
        ENABLE_API_MOCKING: import.meta.env.VITE_ENABLE_API_MOCKING === 'true' ? '启用' : '禁用',
        NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development'
      });
      
      // 调用 AuthContext 中的 login 函数进行登录
      console.log('Login.onFinish - 调用 AuthContext.login 函数');
      const success = await login(values.email, values.password);
      
      console.log('Login.onFinish - 登录结果:', success ? '成功' : '失败');
      if (success) {
        // 登录成功后导航到论文搜索页面
        message.success('登录成功，正在跳转...');
        console.log('Login.onFinish - 导航到 /paper-search');
        navigate('/paper-search');
      }
      // 登录失败的消息已在 login 函数中处理
    } catch (error: any) {
      console.error('Login.onFinish - 登录失败:', error);
      message.error('登录失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 50 }}>
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>登录</Title>
            <Text type="secondary">登录您的研究助手账户</Text>
          </div>
          
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="请输入邮箱" 
                aria-label="邮箱"
                data-testid="email-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                aria-label="密码"
                data-testid="password-input"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                还没有账户？ <a onClick={() => navigate('/register')}>立即注册</a>
              </Text>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default Login;