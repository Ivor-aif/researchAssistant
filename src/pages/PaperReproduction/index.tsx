import React, { useState } from 'react';
import { Card, Steps, Upload, Button, Space, Typography, Divider } from 'antd';
import { UploadOutlined, ExperimentOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

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

  const renderStepContent = (step: ExperimentStep) => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Paragraph style={{ fontSize: '15px', lineHeight: '1.8' }}>{step.description}</Paragraph>
      {step.code && (
        <>
          <Text strong style={{ fontSize: '15px' }}>代码：</Text>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '20px', 
            borderRadius: '10px',
            fontSize: '14px',
            lineHeight: '1.6',
            overflow: 'auto',
            boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.02)'
          }}>
            {step.code}
          </pre>
        </>
      )}
      {step.results && (
        <>
          <Text strong style={{ fontSize: '15px' }}>结果：</Text>
          <Paragraph style={{ 
            fontSize: '15px', 
            lineHeight: '1.8',
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '10px'
          }}>{step.results}</Paragraph>
        </>
      )}
    </Space>
   );



  return (
    <div style={{ 
      padding: '20px', 
      display: 'flex', 
      justifyContent: 'center',
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <Card 
        title={<div style={{ fontSize: '22px', textAlign: 'center', padding: '10px 0' }}>论文复现</div>} 
        bordered={false}
        style={{ 
          width: '100%', 
          maxWidth: '1200px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px'
        }}
      >
        <Space direction="vertical" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '0 20px' }} size="large">
          <Upload
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            style={{ width: '100%' }}
          >
            <Button 
              icon={<UploadOutlined />} 
              style={{ width: '100%', height: '46px', borderRadius: '8px' }}
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
            style={{ width: '100%', height: '46px', borderRadius: '8px' }}
            size="large"
          >
            开始复现
          </Button>

          {experimentSteps.length > 0 && (
            <div style={{ 
              width: '100%', 
              maxWidth: '1100px', 
              margin: '20px auto 0',
              padding: '20px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
            }}>
            <>
              <Divider />
              <Title level={4}>复现进度</Title>
              <Steps
                direction="vertical"
                current={currentStep}
                items={experimentSteps.map((step) => ({
                  title: step.title,
                  description: renderStepContent(step),
                  status: step.status === 'error' ? 'error' : undefined
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