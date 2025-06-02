import React, { useState } from 'react';
import { Card, Steps, Upload, Button, Space, Typography, Divider } from 'antd';
import { UploadOutlined, ExperimentOutlined, CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import './style.css';

const { Title, Text, Paragraph } = Typography;

interface ExperimentStep {
  title: string;
  description: string;
  code?: string;
  results?: string;
  status: 'waiting' | 'in-progress' | 'finished' | 'error';
}

const PaperReproduction: React.FC = () => {
  const [currentStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [experimentSteps, setExperimentSteps] = useState<ExperimentStep[]>([]);

  const handleFileChange = (info: any) => {
    setFileList(info.fileList);
  };

  const handleStartReproduction = async () => {
    try {
      // TODO: 实现实际的论文复现逻辑
      const mockSteps: ExperimentStep[] = [
        {
          title: '环境准备',
          description: '配置实验环境和依赖',
          status: 'finished'
        },
        {
          title: '数据预处理',
          description: '准备和处理实验数据',
          code: 'import pandas as pd\n# 数据预处理代码...',
          status: 'in-progress'
        },
        {
          title: '模型训练',
          description: '训练和验证模型',
          status: 'waiting'
        },
        {
          title: '结果评估',
          description: '评估实验结果',
          status: 'waiting'
        }
      ];
      setExperimentSteps(mockSteps);
    } catch (error) {
      console.error('复现启动失败:', error);
    }
  };

  const getStepIcon = (status: ExperimentStep['status']) => {
    switch (status) {
      case 'finished':
        return <CheckCircleOutlined className="step-status-finished" />;
      case 'in-progress':
        return <SyncOutlined spin className="step-status-in-progress" />;
      case 'waiting':
        return <ClockCircleOutlined className="step-status-waiting" />;
      case 'error':
        return <CloseCircleOutlined className="step-status-error" />;
      default:
        return <ClockCircleOutlined className="step-status-waiting" />;
    }
  };

  const renderStepContent = (step: ExperimentStep) => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Paragraph className="step-description">{step.description}</Paragraph>
      {step.code && (
        <>
          <Text strong className="code-title">代码：</Text>
          <pre className="code-block">
            {step.code}
          </pre>
        </>
      )}
      {step.results && (
        <>
          <Text strong className="results-title">结果：</Text>
          <Paragraph className="results-block">{step.results}</Paragraph>
        </>
      )}
    </Space>
   );

  return (
    <div className="paper-reproduction-container">
      <Card 
        title={
          <div className="reproduction-header">
            <ExperimentOutlined className="reproduction-icon" />
            论文复现
          </div>
        } 
        bordered={false}
        className="reproduction-card"
      >
        <Space direction="vertical" className="upload-container" size="large">
          <Upload
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            style={{ width: '100%' }}
          >
            <Button 
              icon={<UploadOutlined />} 
              className="upload-button"
              size="large"
            >
              上传论文和代码
            </Button>
          </Upload>

          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            onClick={handleStartReproduction}
            disabled={fileList.length === 0}
            className="start-button"
            size="large"
          >
            开始复现
          </Button>

          {experimentSteps.length > 0 && (
            <div className="steps-container">
            <>
              <Divider />
              <Title level={4} className="steps-title">复现进度</Title>
              <Steps
                direction="vertical"
                current={currentStep}
                items={experimentSteps.map((step) => ({
                  title: step.title,
                  description: renderStepContent(step),
                  status: step.status === 'error' ? 'error' : undefined,
                  icon: getStepIcon(step.status)
                }))}
              />
            </>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PaperReproduction;