import React, { useState, useEffect } from 'react';
import { Card, Timeline, Button, Modal, Form, Input, DatePicker, Space, Typography, message, Spin } from 'antd';
import { PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { progressApi } from '../../api';

const { Title, Text } = Typography;

interface ResearchMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'done' | 'in-progress' | 'pending';
}

const ResearchProgress: React.FC = () => {
  const [milestones, setMilestones] = useState<ResearchMilestone[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // 获取研究进度数据
  const fetchResearchProgress = async () => {
    setLoading(true);
    try {
      // 调用后端API获取研究进度
      const response = await progressApi.getProjects();
      
      // 将后端数据转换为前端所需格式
      if (response && response.data) {
        const formattedMilestones = response.data.map((project: any) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          date: project.start_date,
          status: project.status === 'COMPLETED' ? 'done' : 
                 project.status === 'IN_PROGRESS' ? 'in-progress' : 'pending'
        }));
        setMilestones(formattedMilestones);
      }
    } catch (error) {
      console.error('获取研究进度失败:', error);
      message.error('获取研究进度失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchResearchProgress();
  }, []);

  const handleAddMilestone = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 准备提交到后端的数据
      const projectData = {
        title: values.title,
        description: values.description,
        start_date: values.date.format('YYYY-MM-DD'),
        status: 'PLANNING'
      };
      
      // 调用后端API创建项目
      await progressApi.createProject(projectData);
      
      message.success('研究里程碑添加成功');
      setIsModalVisible(false);
      form.resetFields();
      
      // 重新获取最新数据
      fetchResearchProgress();
    } catch (error) {
      console.error('添加里程碑失败:', error);
      message.error('添加里程碑失败，请稍后重试');
    }
  };

  const getTimelineColor = (status: ResearchMilestone['status']) => {
    switch (status) {
      case 'done':
        return 'green';
      case 'in-progress':
        return 'blue';
      case 'pending':
        return 'gray';
      default:
        return 'blue';
    }
  };

  return (
    <div>
      <Card
        title="研究进度追踪"
        bordered={false}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMilestone}
          >
            添加里程碑
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p>正在加载研究进度数据，请稍候...</p>
          </div>
        ) : (
          <>
            <Timeline
              mode="left"
              items={milestones.map(milestone => ({
                color: getTimelineColor(milestone.status),
                label: milestone.date,
                children: (
                  <Space direction="vertical">
                    <Title level={5}>{milestone.title}</Title>
                    <Text>{milestone.description}</Text>
                  </Space>
                )
              }))}
            />

            {milestones.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <ClockCircleOutlined style={{ fontSize: 24, color: '#999' }} />
            <p>暂无研究进度记录，点击"添加里程碑"按钮创建</p>
          </div>
        )}
      </>
    )}
      </Card>

      {/* 添加里程碑模态框 */}
      <Modal
        title="添加研究里程碑"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入里程碑标题' }]}
          >
            <Input placeholder="请输入里程碑标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入里程碑描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入里程碑描述" />
          </Form.Item>
          
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );