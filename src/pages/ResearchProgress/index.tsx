import React, { useState, useEffect } from 'react';
import { Card, Timeline, Button, Modal, Form, Input, DatePicker, Typography, message, Spin } from 'antd';
import { PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import { progressApi } from '../../api';
import './style.css';

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
    } catch (error: any) {
      console.error('获取研究进度失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '获取研究进度失败，请稍后重试';
      
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
        message.error(`获取失败: ${errorMessage}`);
      }, 100);
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
    } catch (error: any) {
      console.error('添加里程碑失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '添加里程碑失败，请稍后重试';
      
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
        message.error(`添加失败: ${errorMessage}`);
      }, 100);
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
    <div className="research-progress-container">
      <Card
        title={
          <div className="progress-header">
            <HistoryOutlined className="progress-icon" />
            研究进度
          </div>
        }
        bordered={false}
        className="progress-card"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddMilestone} size="large" className="add-button">添加里程碑</Button>}
      >
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p className="loading-text">加载中...</p>
          </div>
        ) : milestones.length === 0 ? (
          <div className="empty-container">
            <p className="empty-text">暂无研究进度数据，请添加里程碑</p>
          </div>
        ) : (
          <div className="timeline-container">
            <Timeline mode="left">
              {milestones.map((milestone) => (
                <Timeline.Item
                  key={milestone.id}
                  color={getTimelineColor(milestone.status)}
                  label={<span className="timeline-date">{milestone.date}</span>}
                >
                  <Card
                    size="small"
                    title={<span className="milestone-title">{milestone.title}</span>}
                    className="milestone-card"
                  >
                    <p className="milestone-description">{milestone.description}</p>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </Card>

      {/* 添加里程碑模态框 */}
      <Modal
        title={<span className="modal-title">添加研究里程碑</span>}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label={<span className="form-label">标题</span>}
            rules={[{ required: true, message: '请输入里程碑标题' }]}
          >
            <Input placeholder="请输入里程碑标题" className="form-input" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label={<span className="form-label">描述</span>}
            rules={[{ required: true, message: '请输入里程碑描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入里程碑描述" className="form-textarea" />
          </Form.Item>
          
          <Form.Item
            name="date"
            label={<span className="form-label">日期</span>}
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker className="form-datepicker" />
          </Form.Item>

          <div className="modal-footer">
            <Button className="cancel-button" onClick={() => setIsModalVisible(false)}>取消</Button>
            <Button type="primary" className="submit-button" onClick={handleModalOk}>添加</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ResearchProgress;