import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Space, Typography, message } from 'antd';
import { FileTextOutlined, DownloadOutlined, FileOutlined } from '@ant-design/icons';
import { reportApi } from '../../api';
import './style.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ReportSection {
  title: string;
  content: string;
}

const Report: React.FC = () => {
  const [form] = Form.useForm();
  const [generating, setGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<ReportSection[]>([]);

  const handleGenerate = async (values: any) => {
    setGenerating(true);
    try {
      // 准备提交到后端的数据
      const reportData = {
        title: values.title,
        type: values.type,
        keywords: values.keywords,
        description: values.description || ''
      };
      
      // 调用后端API生成报告
      const response = await reportApi.generateReport(reportData);
      
      if (response && response.data) {
        // 将后端返回的报告数据转换为前端所需格式
        const formattedReport = response.data.sections.map((section: any) => ({
          title: section.title,
          content: section.content
        }));
        
        setReportContent(formattedReport);
        message.success('报告生成成功');
      }
    } catch (error: any) {
      console.error('生成失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '报告生成失败';
      
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
        message.error(`生成失败: ${errorMessage}`);
      }, 100);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      // 获取当前表单数据
      const values = form.getFieldsValue();
      
      // 调用后端API下载报告
      const response = await reportApi.downloadReport({
        title: values.title,
        type: values.type
      });
      
      // 创建下载链接
      if (response && response.data && response.data.download_url) {
        const link = document.createElement('a');
        link.href = response.data.download_url;
        link.download = `${values.title || '研究报告'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('报告下载成功');
      } else {
        message.error('下载链接无效');
      }
    } catch (error: any) {
      console.error('下载失败:', error);
      
      // 获取详细错误信息
      let errorMessage = '报告下载失败';
      
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
        message.error(`下载失败: ${errorMessage}`);
      }, 100);
    }
  };

  return (
    <div className="report-container">
      <Card 
        title={
          <div className="report-header">
            <FileOutlined className="report-icon" />
            报告生成
          </div>
        } 
        bordered={false}
        className="report-card"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form
            form={form}
            onFinish={handleGenerate}
            layout="vertical"
            className="form-container"
          >
            <Form.Item
              name="title"
              label={<span className="form-label">报告标题</span>}
              rules={[{ required: true, message: '请输入报告标题' }]}
            >
              <Input placeholder="请输入报告标题" className="form-input" />
            </Form.Item>

            <Form.Item
              name="type"
              label={<span className="form-label">报告类型</span>}
              rules={[{ required: true, message: '请选择报告类型' }]}
            >
              <Select placeholder="请选择报告类型" className="form-select">
                <Option value="research">研究报告</Option>
                <Option value="experiment">实验报告</Option>
                <Option value="progress">进度报告</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="keywords"
              label={<span className="form-label">关键词</span>}
              rules={[{ required: true, message: '请输入关键词' }]}
            >
              <Input placeholder="请输入关键词，用逗号分隔" className="form-input" />
            </Form.Item>

            <Form.Item
              name="description"
              label={<span className="form-label">报告简介</span>}
            >
              <TextArea
                placeholder="请输入报告简介"
                rows={4}
                className="form-textarea"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                loading={generating}
                htmlType="submit"
                className="generate-button"
              >
                生成报告
              </Button>
            </Form.Item>
          </Form>

          {reportContent.length > 0 && (
            <div className="preview-container">
              <Title level={4} className="preview-title">报告预览</Title>
              {reportContent.map((section, index) => (
                <div key={index}>
                  <Title level={5} className="section-title">{section.title}</Title>
                  <Text className="section-content">{section.content}</Text>
                </div>
              ))}
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                className="download-button"
              >
                下载报告
              </Button>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default Report;