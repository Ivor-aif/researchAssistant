import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message, Tabs, Avatar, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface UserFormData {
  username: string;
}

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AccountSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [usernameForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      usernameForm.setFieldsValue({ username: user.username });
      // 如果用户有头像URL，设置它
      if (user.avatarUrl) {
        setAvatarUrl(user.avatarUrl);
      }
    }
  }, [user, usernameForm]);

  // 处理用户名更新
  const handleUsernameUpdate = async (values: UserFormData) => {
    setLoading(true);
    try {
      const success = updateUser({ username: values.username });
      if (success) {
        // 不需要刷新页面，因为AuthContext会自动更新UI
      }
    } catch (error) {
      console.error('更新用户名失败:', error);
      message.error('更新用户名失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理密码更新
  const handlePasswordUpdate = async (values: PasswordFormData) => {
    setLoading(true);
    try {
      // 从本地存储获取用户信息
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // 查找当前用户
      const currentUser = users.find((u: any) => u.id === user?.id);
      
      if (!currentUser) {
        message.error('用户信息获取失败');
        return;
      }
      
      // 验证旧密码
      if (currentUser.password !== values.oldPassword) {
        message.error('旧密码不正确');
        return;
      }
      
      // 更新密码
      currentUser.password = values.newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      
      message.success('密码已更新');
      passwordForm.resetFields();
    } catch (error) {
      console.error('更新密码失败:', error);
      message.error('更新密码失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理头像上传前的验证
  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传JPG/PNG格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  // 处理头像上传
  const handleAvatarChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // 在实际应用中，这里应该是从服务器响应中获取URL
      // 这里我们使用模拟的方式，将文件转换为base64
      getBase64(info.file.originFileObj as RcFile, (url) => {
        setLoading(false);
        setAvatarUrl(url);
        
        // 更新用户头像
        const success = updateUser({ avatarUrl: url });
        if (success) {
          // AuthContext会自动显示成功消息
        }
      });
    }
  };

  // 将文件转换为base64
  const getBase64 = (img: RcFile, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(img);
  };

  // 自定义上传按钮
  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>上传头像</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>账户设置</Title>
      
      <Tabs defaultActiveKey="profile">
        <TabPane tab="个人资料" key="profile">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Space direction="vertical" align="center">
              <Avatar 
                size={80} 
                src={avatarUrl} 
                icon={!avatarUrl && <UserOutlined />}
              />
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleAvatarChange}
                customRequest={({ onSuccess }) => {
                  // 模拟上传成功
                  setTimeout(() => {
                    onSuccess?.('ok');
                  }, 500);
                }}
              >
                {uploadButton}
              </Upload>
              <Text type="secondary">支持 JPG、PNG 格式，文件小于 2MB</Text>
            </Space>
          </div>
          
          <Form
            form={usernameForm}
            layout="vertical"
            onFinish={handleUsernameUpdate}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
              >
                更新用户名
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane tab="修改密码" key="password">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordUpdate}
          >
            <Form.Item
              name="oldPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
            </Form.Item>
            
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度不能少于6个字符' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
              >
                更新密码
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AccountSettings;