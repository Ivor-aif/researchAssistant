import React, { useState } from 'react';
import { Card, Steps, Upload, Form, Input, Button, Space, Typography, Divider } from 'antd';
import { UploadOutlined, ExperimentOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ExperimentStep {
  title: string;
  description: string;
  code?: string;
  results?: string;
  status: 'waiting' | 'in-progress' | 'finished' | 'error';
}

const PaperReproduction: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [experimentSteps, setExperimentSteps] = useState<ExperimentStep[]>([]);
  const [form] = Form.useForm();

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

  const renderStepContent = (step: ExperimentStep) => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Paragraph>{step.description}</Paragraph>
      {step.code && (
        <>
          <Text strong>代码：</Text>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
            {step.code}
          </pre>
        </>
      )}
      {step.results && (
        <>
          <Text strong>结果：</Text>
          <Paragraph>{step.results}</Paragraph>
        </>
      )}
    </Space>
  );

  return (
    <div>
      <Card title="论文复现" bordered={false}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Upload
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>上传论文和代码</Button>
          </Upload>

          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            onClick={handleStartReproduction}
            disabled={fileList.length === 0}
          >
            开始复现
          </Button>

          {experimentSteps.length > 0 && (
            <>
              <Divider />
              <Title level={4}>复现进度</Title>
              <Steps
                direction="vertical"
                current={currentStep}
                items={experimentSteps.map((step, index) => ({
                  title: step.title,
                  description: renderStepContent(step),
                  status: step.status === 'error' ? 'error' : undefined
                }))}
              />
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PaperReproduction;