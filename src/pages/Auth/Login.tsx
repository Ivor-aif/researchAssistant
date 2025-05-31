import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from './authSlice';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginFormData) => {
    try {
      setLoading(true);
      // 调用 Redux action 进行登录
      const result = await dispatch(login(values));
      
      if (result.payload) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error('登录失败，请检查邮箱和密码');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
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