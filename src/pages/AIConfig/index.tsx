import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Typography,
  Divider,
  Row,
  Col,
  InputNumber,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  StarOutlined,
  StarFilled,
  ApiOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { AIConfigService } from '../../services/aiConfigService';
import type {
  AIAPIConfig,
  AIAPIConfigCreate,
  AIAPIConfigUpdate,
  TestConfigResponse
} from '../../types/aiConfig';
import {
  AIProviderType,
  AI_PROVIDER_OPTIONS,
  TASK_TYPE_OPTIONS
} from '../../types/aiConfig';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface PromptGeneratorModalProps {
  visible: boolean;
  onCancel: () => void;
  configs: AIAPIConfig[];
}

const PromptGeneratorModal: React.FC<PromptGeneratorModalProps> = ({
  visible,
  onCancel,
  configs
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  const handleGenerate = async (values: any) => {
    setLoading(true);
    try {
      const response = await AIConfigService.generatePrompt({
        keywords: values.keywords.split(',').map((k: string) => k.trim()),
        task_type: values.task_type,
        context: values.context,
        config_id: values.config_id
      });
      setGeneratedPrompt(response.prompt);
      message.success('提示词生成成功');
    } catch (error: any) {
      console.error('生成提示词失败:', error);
      message.error(`生成提示词失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    message.success('提示词已复制到剪贴板');
  };

  return (
    <Modal
      title={<><BulbOutlined /> 生成AI提示词</>}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleGenerate}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="keywords"
              label="关键词"
              rules={[{ required: true, message: '请输入关键词' }]}
            >
              <Input placeholder="请输入关键词，用逗号分隔" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="task_type"
              label="任务类型"
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select 
                placeholder="选择任务类型"
                options={TASK_TYPE_OPTIONS.map(option => ({
                  value: option.value,
                  label: option.label
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="context"
          label="上下文信息（可选）"
        >
          <TextArea rows={3} placeholder="提供额外的上下文信息" />
        </Form.Item>
        
        <Form.Item
          name="config_id"
          label="使用的AI配置（可选）"
        >
          <Select 
            placeholder="选择AI配置，留空使用主配置" 
            allowClear
            options={configs.map(config => ({
              value: config.id,
              label: AIConfigService.formatConfigDisplayName(config)
            }))}
          />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} icon={<BulbOutlined />}>
            生成提示词
          </Button>
        </Form.Item>
      </Form>
      
      {generatedPrompt && (
        <>
          <Divider>生成的提示词</Divider>
          <Card>
            <Paragraph copyable={{ onCopy: handleCopy }}>
              {generatedPrompt}
            </Paragraph>
          </Card>
        </>
      )}
    </Modal>
  );
};

const AIConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<AIAPIConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [promptModalVisible, setPromptModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIAPIConfig | null>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testingConfig, setTestingConfig] = useState<AIAPIConfig | null>(null);
  const [, setPrimaryConfigId] = useState<number | null>(null);
  
  const [form] = Form.useForm();
  const [testForm] = Form.useForm();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await AIConfigService.getUserConfigs();
      setConfigs(response.configs);
      setPrimaryConfigId(response.primary_config_id || null);
    } catch (error: any) {
      console.error('加载AI配置失败:', error);
      message.error('加载AI配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    // 设置默认值
    form.setFieldsValue({
      provider_type: AIProviderType.OPENAI, // 设置默认AI提供商
      is_active: true,
      use_for_innovation_analysis: true,
      use_for_paper_recommendation: true,
      use_for_research_analysis: true,
      use_for_chat: true,
      use_for_prompt_generation: false,
      max_tokens: 4000,
      temperature: '0.7',
      top_p: '1.0',
      frequency_penalty: '0.0',
      presence_penalty: '0.0'
    });
    setModalVisible(true);
  };

  const handleEdit = (config: AIAPIConfig) => {
    setEditingConfig(config);
    form.setFieldsValue({
      ...config,
      api_key: '' // 不显示现有密钥
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingConfig) {
        // 更新配置
        const updateData: AIAPIConfigUpdate = { ...values };
        if (!values.api_key) {
          delete updateData.api_key; // 如果没有输入新密钥，不更新密钥
        }
        await AIConfigService.updateConfig(editingConfig.id, updateData);
        message.success('AI配置更新成功');
      } else {
        // 创建配置
        await AIConfigService.createConfig(values as AIAPIConfigCreate);
        message.success('AI配置创建成功');
      }
      setModalVisible(false);
      loadConfigs();
    } catch (error: any) {
      console.error('保存AI配置失败:', error);
      message.error(`保存AI配置失败: ${error.message || '未知错误'}`);
    }
  };

  const handleDelete = async (configId: number) => {
    try {
      await AIConfigService.deleteConfig(configId);
      message.success('AI配置删除成功');
      loadConfigs();
    } catch (error: any) {
      console.error('删除AI配置失败:', error);
      message.error('删除AI配置失败');
    }
  };

  const handleSetPrimary = async (configId: number) => {
    try {
      await AIConfigService.setPrimaryConfig(configId);
      message.success('主配置设置成功');
      loadConfigs();
    } catch (error: any) {
      console.error('设置主配置失败:', error);
      message.error('设置主配置失败');
    }
  };

  const handleTest = (config: AIAPIConfig) => {
    setTestingConfig(config);
    testForm.setFieldsValue({
      test_prompt: 'Hello, this is a test message. Please respond briefly.'
    });
    setTestModalVisible(true);
  };

  const handleTestSubmit = async (values: any) => {
    if (!testingConfig) return;
    
    try {
      const response: TestConfigResponse = await AIConfigService.testConfig(
        testingConfig.id,
        values.test_prompt
      );
      
      if (response.success) {
        Modal.success({
          title: '测试成功',
          content: (
            <div>
              <p><strong>响应时间:</strong> {response.latency_ms}ms</p>
              <p><strong>AI响应:</strong></p>
              <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                {response.response}
              </div>
            </div>
          ),
          width: 600
        });
      } else {
        Modal.error({
          title: '测试失败',
          content: response.error || '未知错误'
        });
      }
      setTestModalVisible(false);
    } catch (error: any) {
      console.error('测试AI配置失败:', error);
      message.error('测试AI配置失败');
    }
  };



  const columns = [
    {
      title: '配置名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: AIAPIConfig) => (
        <Space>
          {record.is_primary ? (
            <StarFilled style={{ color: '#faad14' }} />
          ) : (
            <StarOutlined style={{ color: '#d9d9d9' }} />
          )}
          <strong>{text}</strong>
          {!record.is_active && <Tag color="red">已禁用</Tag>}
        </Space>
      )
    },
    {
      title: 'AI提供商',
      dataIndex: 'provider_type',
      key: 'provider_type',
      render: (type: AIProviderType) => {
        const option = AI_PROVIDER_OPTIONS.find(opt => opt.value === type);
        return <Tag color="blue">{option?.label || type}</Tag>;
      }
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      key: 'model_name',
      render: (text: string) => text || '-'
    },
    {
      title: '使用场景',
      key: 'usage',
      render: (record: AIAPIConfig) => {
        const usages = AIConfigService.getConfigUsageDescription(record);
        return (
          <Space wrap>
            {usages.map(usage => (
              <Tag key={usage}>{usage}</Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: AIAPIConfig) => (
        <Space>
          {!record.is_primary && (
            <Tooltip title="设为主配置">
              <Button
                type="text"
                icon={<StarOutlined />}
                onClick={() => handleSetPrimary(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="测试配置">
            <Button
              type="text"
              icon={<ExperimentOutlined />}
              onClick={() => handleTest(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个AI配置吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <ApiOutlined /> AI API 配置管理
          </Title>
          <Paragraph>
            配置多个AI服务提供商，为不同的任务选择最适合的AI模型。您可以设置一个主配置用于简单任务，
            并为特定功能配置专门的AI服务。
          </Paragraph>
          
          <Alert
            message="使用提示"
            description="主配置（标有星号）将用于提示词生成等简单任务。您可以为每个配置指定适用的场景，系统会自动选择合适的配置。"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              添加AI配置
            </Button>
            <Button
              icon={<BulbOutlined />}
              onClick={() => setPromptModalVisible(true)}
            >
              生成提示词
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个配置`
          }}
        />
      </Card>

      {/* 配置编辑模态框 */}
      <Modal
        title={editingConfig ? '编辑AI配置' : '添加AI配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="配置名称"
                rules={[{ required: true, message: '请输入配置名称' }]}
              >
                <Input placeholder="例如：GPT-4 创新分析" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="provider_type"
                label="AI提供商（可选）"
              >
                <Input 
                  value="OpenAI (默认)"
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="api_key"
                label="API密钥"
                rules={[
                  { required: !editingConfig, message: '请输入API密钥' }
                ]}
              >
                <Input.Password
                  placeholder={editingConfig ? '留空保持不变' : '输入API密钥'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model_name"
                label="模型名称"
              >
                <Input placeholder="例如：gpt-4" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="api_endpoint"
            label="API端点（可选）"
          >
            <Input placeholder="自定义API端点，留空使用默认" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="system_prompt"
                label="系统提示词（可选）"
              >
                <TextArea rows={3} placeholder="设置AI的角色和行为" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="default_prompt"
                label="默认提示词（可选）"
              >
                <TextArea rows={3} placeholder="默认的用户提示词" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>配置选项</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="is_primary" valuePropName="checked">
                <Switch checkedChildren="主配置" unCheckedChildren="普通配置" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_active" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>使用场景</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="use_for_innovation_analysis" valuePropName="checked">
                <Switch checkedChildren="创新点分析" unCheckedChildren="创新点分析" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="use_for_paper_recommendation" valuePropName="checked">
                <Switch checkedChildren="论文推荐" unCheckedChildren="论文推荐" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="use_for_research_analysis" valuePropName="checked">
                <Switch checkedChildren="研究分析" unCheckedChildren="研究分析" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="use_for_chat" valuePropName="checked">
                <Switch checkedChildren="聊天对话" unCheckedChildren="聊天对话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="use_for_prompt_generation" valuePropName="checked">
            <Switch checkedChildren="提示词生成" unCheckedChildren="提示词生成" />
          </Form.Item>

          <Divider>高级参数</Divider>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="max_tokens"
                label="最大Token数"
              >
                <InputNumber min={1} max={32000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="temperature"
                label="温度"
              >
                <Input placeholder="0.0-2.0" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="top_p"
                label="Top P"
              >
                <Input placeholder="0.0-1.0" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="frequency_penalty"
                label="频率惩罚"
              >
                <Input placeholder="-2.0-2.0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingConfig ? '更新配置' : '创建配置'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 测试配置模态框 */}
      <Modal
        title="测试AI配置"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={null}
      >
        <Form
          form={testForm}
          layout="vertical"
          onFinish={handleTestSubmit}
        >
          <Form.Item
            name="test_prompt"
            label="测试提示词"
            rules={[{ required: true, message: '请输入测试提示词' }]}
          >
            <TextArea rows={4} placeholder="输入要测试的提示词" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                开始测试
              </Button>
              <Button onClick={() => setTestModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 提示词生成模态框 */}
      <PromptGeneratorModal
        visible={promptModalVisible}
        onCancel={() => setPromptModalVisible(false)}
        configs={configs}
      />
    </div>
  );
};

export default AIConfigPage;