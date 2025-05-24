import React, { useState } from 'react';
import { Card, Input, Button, List, Typography, Spin, message, Upload, Tabs, Progress } from 'antd';
import { BulbOutlined, UploadOutlined, FileTextOutlined, FilePdfOutlined } from '@ant-design/icons';
import { innovationApi } from '../../api';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;

interface InnovationPoint {
  id: string;
  title: string;
  description: string;
  significance: string;
  relevance: number; // 相关度评分 1-5
  technical_feasibility?: number; // 技术可行性评分
  implementation_difficulty?: string; // 实现难度
  novelty_score?: number; // 新颖性评分
}

interface AnalysisProgress {
  step: string;
  progress: number;
  status: 'processing' | 'completed' | 'error';
}

const InnovationAnalysis: React.FC = () => {
  const [paperId, setPaperId] = useState('');
  const [loading, setLoading] = useState(false);
  const [innovationPoints, setInnovationPoints] = useState<InnovationPoint[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress[]>([]);
  const [activeTab, setActiveTab] = useState('1');

  const updateProgress = (step: string, progress: number, status: 'processing' | 'completed' | 'error') => {
    setAnalysisProgress(prev => {
      const existing = prev.find(p => p.step === step);
      if (existing) {
        return prev.map(p => p.step === step ? { ...p, progress, status } : p);
      }
      return [...prev, { step, progress, status }];
    });
  };

  const handleAnalyzeById = async () => {
    if (!paperId.trim()) {
      message.warning('请输入论文ID或DOI');
      return;
    }

    setLoading(true);
    setAnalysisProgress([]);
    
    try {
      updateProgress('获取论文内容', 20, 'processing');
      
      // 调用后端API进行创新点分析
      const response = await innovationApi.analyzeInnovation(paperId);
      
      updateProgress('获取论文内容', 100, 'completed');
      updateProgress('AI分析创新点', 50, 'processing');
      
      // 模拟分析过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateProgress('AI分析创新点', 100, 'completed');
      updateProgress('生成分析报告', 100, 'completed');
      
      setInnovationPoints(response.data || []);
      
      if (response.data?.length === 0) {
        message.info('未能识别出创新点，请检查论文ID是否正确');
      } else {
        message.success(`成功识别出 ${response.data.length} 个创新点`);
      }
    } catch (error) {
      console.error('分析失败:', error);
      updateProgress('AI分析创新点', 0, 'error');
      message.error('创新点分析失败，请稍后重试');
      
      // 如果API调用失败，使用模拟数据（仅用于开发测试）
      const mockPoints: InnovationPoint[] = [
        {
          id: '1',
          title: '改进的注意力机制',
          description: '本文提出了一种新的注意力机制，能够更有效地捕捉长距离依赖关系。通过引入多尺度特征融合和自适应权重调整，该机制能够动态调整注意力分布。',
          significance: '该创新点显著提高了模型在长文本处理任务上的性能，比基准模型提升了15%。在机器翻译和文档摘要任务中表现尤为突出。',
          relevance: 5,
          technical_feasibility: 8.5,
          implementation_difficulty: '中等',
          novelty_score: 9.2
        },
        {
          id: '2',
          title: '轻量级模型架构',
          description: '作者设计了一种计算效率更高的模型架构，通过知识蒸馏和参数共享技术，减少了50%的参数量。',
          significance: '使模型能够在资源受限的设备上运行，同时保持接近大模型的性能。为移动端AI应用提供了新的可能性。',
          relevance: 4,
          technical_feasibility: 7.8,
          implementation_difficulty: '较高',
          novelty_score: 8.1
        },
        {
          id: '3',
          title: '自适应学习率调度策略',
          description: '提出了一种基于梯度变化和损失函数特征的自适应学习率调度方法，能够根据训练状态动态调整学习率。',
          significance: '显著提高了模型收敛速度和最终性能，减少了超参数调优的工作量。',
          relevance: 3,
          technical_feasibility: 9.0,
          implementation_difficulty: '较低',
          novelty_score: 7.5
        }
      ];
      setInnovationPoints(mockPoints);
      updateProgress('生成分析报告', 100, 'completed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const isValidType = file.type === 'application/pdf' || file.type === 'text/html' || file.name.endsWith('.html');
    if (!isValidType) {
      message.error('只支持PDF和HTML格式的文件！');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过10MB！');
      return false;
    }

    setUploadedFile(file);
    message.success('文件上传成功，点击分析按钮开始分析');
    return false; // 阻止自动上传
  };

  const handleAnalyzeFile = async () => {
    if (!uploadedFile) {
      message.warning('请先上传论文文件');
      return;
    }

    setLoading(true);
    setAnalysisProgress([]);
    
    try {
      updateProgress('解析文件内容', 30, 'processing');
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      // 模拟文件解析过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateProgress('解析文件内容', 100, 'completed');
      updateProgress('AI分析创新点', 40, 'processing');
      
      // 调用后端API进行文件分析
      const response = await innovationApi.analyzeFileInnovation(formData);
      
      updateProgress('AI分析创新点', 100, 'completed');
      updateProgress('生成分析报告', 100, 'completed');
      
      if (response.success) {
        setInnovationPoints(response.innovations || []);
        message.success(`成功从文件中识别出 ${response.innovations?.length || 0} 个创新点`);
      } else {
        throw new Error(response.error || '文件分析失败');
      }
    } catch (error) {
      console.error('文件分析失败:', error);
      updateProgress('AI分析创新点', 0, 'error');
      message.error('文件分析失败，请检查文件格式或稍后重试');
      
      // 使用模拟数据作为fallback
      const mockPoints: InnovationPoint[] = [
        {
          id: '1',
          title: '基于深度学习的图像增强算法',
          description: '提出了一种结合生成对抗网络和注意力机制的图像增强方法，能够自适应地增强不同类型的图像。',
          significance: '在低光照和噪声图像处理方面取得了显著改进，PSNR提升了3.2dB。',
          relevance: 5,
          technical_feasibility: 8.0,
          implementation_difficulty: '中等',
          novelty_score: 8.8
        },
        {
          id: '2',
          title: '多模态特征融合框架',
          description: '设计了一个统一的多模态特征融合框架，能够有效整合文本、图像和音频信息。',
          significance: '为多模态学习任务提供了新的解决方案，在多个基准数据集上达到了最先进的性能。',
          relevance: 4,
          technical_feasibility: 7.5,
          implementation_difficulty: '较高',
          novelty_score: 9.0
        }
      ];
      setInnovationPoints(mockPoints);
      updateProgress('生成分析报告', 100, 'completed');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressSteps = () => {
    if (analysisProgress.length === 0) return null;
    
    return (
      <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <Title level={5} style={{ marginBottom: '16px' }}>分析进度</Title>
        {analysisProgress.map((step, index) => (
          <div key={step.step} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <Text>{step.step}</Text>
              <Text type={step.status === 'error' ? 'danger' : step.status === 'completed' ? 'success' : 'secondary'}>
                {step.status === 'error' ? '失败' : step.status === 'completed' ? '完成' : '进行中'}
              </Text>
            </div>
            <Progress 
              percent={step.progress} 
              status={step.status === 'error' ? 'exception' : step.status === 'completed' ? 'success' : 'active'}
              size="small"
            />
          </div>
        ))}
      </div>
    );
  };

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
        title={<div style={{ fontSize: '22px', textAlign: 'center', padding: '10px 0' }}>创新点分析</div>} 
        bordered={false}
        style={{ 
          width: '100%', 
          maxWidth: '1200px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px'
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <TabPane tab={<span><FileTextOutlined />论文ID/DOI</span>} key="1">
            <div style={{ 
              width: '100%', 
              maxWidth: '800px', 
              margin: '0 auto 40px',
              padding: '0 20px'
            }}>
              <TextArea 
                placeholder="请输入论文ID或DOI，例如：10.1038/nature12373 或 arXiv:1706.03762" 
                value={paperId}
                onChange={(e) => setPaperId(e.target.value)}
                style={{ marginBottom: '20px', borderRadius: '8px' }}
                rows={3}
              />
              <Button 
                type="primary" 
                icon={<BulbOutlined />} 
                loading={loading}
                onClick={handleAnalyzeById}
                size="large"
            style={{ width: '100%', height: '46px', borderRadius: '8px' }}
          >
            分析创新点
          </Button>
        </div>
      </TabPane>
      
      <TabPane tab={<span><FilePdfOutlined />文件上传</span>} key="2">
        <div style={{ 
          width: '100%', 
          maxWidth: '800px', 
          margin: '0 auto 40px',
          padding: '0 20px'
        }}>
          <Dragger
            beforeUpload={handleFileUpload}
            showUploadList={false}
            style={{ marginBottom: '20px' }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持PDF和HTML格式的论文文件，文件大小不超过10MB
            </p>
          </Dragger>
          
          {uploadedFile && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <Text strong>已上传文件：</Text>
              <Text>{uploadedFile.name}</Text>
              <Text type="secondary"> ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</Text>
            </div>
          )}
          
          <Button 
            type="primary" 
            icon={<BulbOutlined />} 
            loading={loading}
            onClick={handleAnalyzeFile}
            disabled={!uploadedFile}
            size="large"
            style={{ width: '100%', height: '46px', borderRadius: '8px' }}
          >
            分析文件创新点
          </Button>
        </div>
      </TabPane>
    </Tabs>
    
    {renderProgressSteps()}

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 0', 
            color: '#999',
            backgroundColor: '#f9f9f9',
            borderRadius: '12px',
            margin: '0 auto',
            width: '100%',
            maxWidth: '1100px'
          }}>
            <Spin size="large" />
            <p style={{ marginTop: '20px', fontSize: '16px' }}>正在分析论文创新点，请稍候...</p>
          </div>
        ) : innovationPoints.length > 0 ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Title level={4}>发现 {innovationPoints.length} 个创新点</Title>
            </div>
            <List
              itemLayout="vertical"
              dataSource={innovationPoints}
              style={{ 
                background: '#fff', 
                borderRadius: '12px',
                width: '100%',
                maxWidth: '1100px',
                margin: '0 auto',
                padding: '0 20px'
              }}
              renderItem={(item) => (
                <List.Item
                  style={{ 
                    padding: '24px', 
                    marginBottom: '24px', 
                    border: '1px solid #f0f0f0', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Card 
                    type="inner" 
                    title={<span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>{item.title}</span>}
                    style={{ borderRadius: '10px' }}
                    extra={
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {item.novelty_score && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666' }}>新颖性</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                              {item.novelty_score}/10
                            </div>
                          </div>
                        )}
                        {item.technical_feasibility && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666' }}>可行性</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                              {item.technical_feasibility}/10
                            </div>
                          </div>
                        )}
                      </div>
                    }
                  >
                    <Paragraph style={{ fontSize: '15px', lineHeight: '1.8' }}>
                      <Text strong style={{ fontSize: '15px' }}>描述：</Text> {item.description}
                    </Paragraph>
                    <Paragraph style={{ fontSize: '15px', lineHeight: '1.8' }}>
                      <Text strong style={{ fontSize: '15px' }}>重要性：</Text> {item.significance}
                    </Paragraph>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                      <div>
                        <Text strong>相关度：</Text> 
                        <Progress 
                          percent={item.relevance * 20} 
                          size="small" 
                          style={{ width: '100px', display: 'inline-block', marginLeft: '8px' }}
                          format={() => `${item.relevance}/5`}
                        />
                      </div>
                      {item.implementation_difficulty && (
                        <div>
                          <Text strong>实现难度：</Text>
                          <Text 
                            style={{ 
                              color: item.implementation_difficulty === '较低' ? '#52c41a' : 
                                     item.implementation_difficulty === '中等' ? '#faad14' : '#ff4d4f',
                              marginLeft: '8px'
                            }}
                          >
                            {item.implementation_difficulty}
                          </Text>
                        </div>
                      )}
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        ) : null}
    </Card>
    </div>
  );
};

export default InnovationAnalysis;