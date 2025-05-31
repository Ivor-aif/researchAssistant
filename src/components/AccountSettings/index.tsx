import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message, Tabs, Avatar, Space, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, UploadOutlined, MailOutlined, LinkOutlined, ApiOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { aiApi } from '../../api';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import type { UserProfile, ApiKeys } from '../../types';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

interface UserFormData {
  username: string;
}

interface ProfileFormData {
  author_name: string;
  author_email: string;
  author_website: string;
}

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiKeysFormData {
  openai_api_key: string;
  other_api_keys: Record<string, string>;
}

const AccountSettings: React.FC = () => {
  const { user, updateUser, updateProfile } = useAuth();
  const [usernameForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [apiKeysForm] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // 设置用户名
      usernameForm.setFieldsValue({ username: user.username });
      
      // 设置署名信息
      profileForm.setFieldsValue({
        author_name: user.author_name || '',
        author_email: user.author_email || '',
        author_website: user.author_website || ''
      });
      
      // 如果用户有头像URL，设置它
      if (user.avatarUrl) {
        setAvatarUrl(user.avatarUrl);
      }
    }
  }, [user, usernameForm, profileForm]);
  
  // 加载API密钥
  useEffect(() => {
    const loadApiKeys = async () => {
      if (user) {
        try {
          setApiKeysLoading(true);
          const response = await aiApi.getApiKeys();
          
          if (response) {
            apiKeysForm.setFieldsValue({
              openai_api_key: response.openai_api_key || '',
              other_api_keys: response.other_api_keys || {}
            });
          }
        } catch (error) {
          console.error('获取API密钥失败:', error);
        } finally {
          setApiKeysLoading(false);
        }
      }
    };
    
    loadApiKeys();
  }, [user, apiKeysForm]);

  // 处理用户名更新
  const handleUsernameUpdate = async (values: UserFormData) => {
    setLoading(true);
    try {
      const success = await updateUser({ username: values.username });
      if (success) {
        // 不需要刷新页面，因为AuthContext会自动更新UI
      }
    } catch (error: any) {
      console.error('更新用户名失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '更新用户名失败';
      
      // 尝试从错误对象中提取更详细的错误信息
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 显示错误信息
      setTimeout(() => {
        message.error(`更新用户名失败: ${errorMessage}`);
      }, 100);
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
    } catch (error: any) {
      console.error('更新密码失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '更新密码失败';
      
      // 尝试从错误对象中提取更详细的错误信息
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 显示错误信息
      setTimeout(() => {
        message.error(`更新密码失败: ${errorMessage}`);
      }, 100);
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
      getBase64(info.file.originFileObj as RcFile, async (url) => {
        setLoading(false);
        setAvatarUrl(url);
        
        // 更新用户头像
        const success = await updateUser({ avatarUrl: url });
        if (success) {
          // AuthContext会自动显示成功消息
        }
      });
    }
  };

  // 处理署名信息更新
  const handleProfileUpdate = async (values: ProfileFormData) => {
    setLoading(true);
    try {
      const success = await updateProfile(values);
      if (!success) {
        throw new Error('更新署名信息失败');
      }
    } catch (error: any) {
      console.error('更新署名信息失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '更新署名信息失败';
      
      // 尝试从错误对象中提取更详细的错误信息
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 显示错误信息
      setTimeout(() => {
        message.error(`更新署名信息失败: ${errorMessage}`);
      }, 100);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理API密钥更新
  const handleApiKeysUpdate = async (values: ApiKeysFormData) => {
    setApiKeysLoading(true);
    try {
      const response = await aiApi.updateApiKeys(values);
      
      if (response) {
        message.success('API密钥已更新');
      } else {
        throw new Error('更新API密钥失败');
      }
    } catch (error: any) {
      console.error('更新API密钥失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '更新API密钥失败';
      
      // 尝试从错误对象中提取更详细的错误信息
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 显示错误信息
      setTimeout(() => {
        message.error(`更新API密钥失败: ${errorMessage}`);
      }, 100);
    } finally {
      setApiKeysLoading(false);
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
          
          <Divider>论文署名信息</Divider>
          <Paragraph type="secondary">
            设置您的论文署名信息，这些信息将用于生成研究报告和论文。
          </Paragraph>
          
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileUpdate}
          >
            <Form.Item
              name="author_name"
              label="署名名称"
              rules={[{ required: false, message: '请输入您的署名名称' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="如：张三" />
            </Form.Item>
            
            <Form.Item
              name="author_email"
              label="通讯作者邮箱"
              rules={[
                { required: false, message: '请输入您的通讯邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="如：example@university.edu" />
            </Form.Item>
            
            <Form.Item
              name="author_website"
              label="个人网站链接"
              rules={[
                { required: false, message: '请输入您的个人网站链接' },
                { type: 'url', message: '请输入有效的URL地址', warningOnly: true }
              ]}
            >
              <Input prefix={<LinkOutlined />} placeholder="如：https://yourname.github.io" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
              >
                更新署名信息
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
        
        <TabPane tab="AI服务设置" key="ai-services">
          <Paragraph type="secondary">
            设置您的AI服务API密钥，这些密钥将用于创新点分析、论文检索等功能。
            您的API密钥将被安全地存储在服务器上，不会被泄露给第三方。
          </Paragraph>
          
          <Form
            form={apiKeysForm}
            layout="vertical"
            onFinish={handleApiKeysUpdate}
          >
            <Form.Item
              name="openai_api_key"
              label="OpenAI API密钥"
              rules={[{ required: false, message: '请输入您的OpenAI API密钥' }]}
            >
              <Input.Password 
                prefix={<ApiOutlined />} 
                placeholder="sk-..."
                visibilityToggle={{ visible: false }}
              />
            </Form.Item>
            
            <Divider>其他AI服务（可选）</Divider>
            
            <Form.Item
              label="其他AI服务API密钥"
              help="您可以添加其他AI服务的API密钥，以便在创新点分析等功能中使用。"
            >
              <Form.Item
                name={['other_api_keys', 'anthropic']}
                label="Anthropic API密钥"
                rules={[{ required: false }]}
              >
                <Input.Password 
                  prefix={<KeyOutlined />} 
                  placeholder="Anthropic API密钥"
                  visibilityToggle={{ visible: false }}
                />
              </Form.Item>
              
              <Form.Item
                name={['other_api_keys', 'google_ai']}
                label="Google AI API密钥"
                rules={[{ required: false }]}
              >
                <Input.Password 
                  prefix={<KeyOutlined />} 
                  placeholder="Google AI API密钥"
                  visibilityToggle={{ visible: false }}
                />
              </Form.Item>
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={apiKeysLoading}
                block
              >
                更新API密钥
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AccountSettings;