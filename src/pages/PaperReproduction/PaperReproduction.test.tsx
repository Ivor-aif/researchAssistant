import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaperReproduction from './index';
import '@testing-library/jest-dom';

// 模拟 antd 组件
jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd');
  return {
    ...originalModule,
    message: {
      success: jest.fn(),
      error: jest.fn(),
    },
    Upload: {
      ...originalModule.Upload,
      Dragger: ({ children, onChange }) => (
        <div 
          data-testid="upload-dragger"
          onClick={() => onChange({ file: { name: 'test-paper.pdf', status: 'done' }, fileList: [] })}
        >
          {children}
        </div>
      ),
    },
  };
});

describe('PaperReproduction 组件', () => {
  beforeEach(() => {
    // 清除所有模拟函数的调用记录
    jest.clearAllMocks();
  });

  test('渲染论文复现页面', () => {
    render(<PaperReproduction />);
    
    // 验证页面标题存在
    expect(screen.getByText('论文复现')).toBeInTheDocument();
    
    // 验证上传区域存在
    expect(screen.getByText('点击或拖拽文件到此区域上传')).toBeInTheDocument();
  });

  test('上传论文文件', async () => {
    render(<PaperReproduction />);
    
    // 点击上传区域
    const uploadArea = screen.getByTestId('upload-dragger');
    fireEvent.click(uploadArea);
    
    // 验证文件已上传
    await waitFor(() => {
      expect(screen.getByText('test-paper.pdf')).toBeInTheDocument();
    });
  });

  test('添加实验步骤', async () => {
    render(<PaperReproduction />);
    
    // 点击添加步骤按钮
    const addButton = screen.getByText('添加步骤');
    fireEvent.click(addButton);
    
    // 填写表单
    await waitFor(() => {
      const titleInput = screen.getByLabelText('步骤标题');
      const descriptionInput = screen.getByLabelText('步骤描述');
      
      userEvent.type(titleInput, '数据预处理');
      userEvent.type(descriptionInput, '对原始数据进行清洗和标准化');
    });
    
    // 点击确定按钮
    const okButton = screen.getByText('确定');
    fireEvent.click(okButton);
    
    // 验证新的步骤已添加到列表中
    await waitFor(() => {
      expect(screen.getByText('数据预处理')).toBeInTheDocument();
      expect(screen.getByText('对原始数据进行清洗和标准化')).toBeInTheDocument();
      expect(screen.getByText('等待中')).toBeInTheDocument();
    });
  });

  test('更新实验步骤状态', async () => {
    render(<PaperReproduction />);
    
    // 首先添加一个步骤
    const addButton = screen.getByText('添加步骤');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('步骤标题');
      userEvent.type(titleInput, '模型训练');
      
      const okButton = screen.getByText('确定');
      fireEvent.click(okButton);
    });
    
    // 验证步骤已添加并且状态为等待中
    await waitFor(() => {
      expect(screen.getByText('模型训练')).toBeInTheDocument();
      expect(screen.getByText('等待中')).toBeInTheDocument();
    });
    
    // 点击开始按钮
    const startButton = screen.getByText('开始');
    fireEvent.click(startButton);
    
    // 验证状态已更改为进行中
    await waitFor(() => {
      expect(screen.getByText('进行中')).toBeInTheDocument();
    });
    
    // 点击完成按钮
    const finishButton = screen.getByText('完成');
    fireEvent.click(finishButton);
    
    // 验证状态已更改为已完成
    await waitFor(() => {
      expect(screen.getByText('已完成')).toBeInTheDocument();
    });
  });

  test('添加代码到实验步骤', async () => {
    render(<PaperReproduction />);
    
    // 首先添加一个步骤
    const addButton = screen.getByText('添加步骤');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('步骤标题');
      userEvent.type(titleInput, '特征提取');
      
      const okButton = screen.getByText('确定');
      fireEvent.click(okButton);
    });
    
    // 点击编辑代码按钮
    const codeButton = screen.getByText('编辑代码');
    fireEvent.click(codeButton);
    
    // 在代码编辑器中输入代码
    await waitFor(() => {
      const codeEditor = screen.getByLabelText('代码编辑器');
      userEvent.type(codeEditor, 'import numpy as np\n\ndef extract_features(data):\n    return np.mean(data, axis=0)');
    });
    
    // 保存代码
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);
    
    // 验证代码已保存
    await waitFor(() => {
      expect(screen.getByText('代码已保存')).toBeInTheDocument();
    });
  });

  test('记录实验结果', async () => {
    render(<PaperReproduction />);
    
    // 首先添加一个步骤并完成
    const addButton = screen.getByText('添加步骤');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('步骤标题');
      userEvent.type(titleInput, '模型评估');
      
      const okButton = screen.getByText('确定');
      fireEvent.click(okButton);
    });
    
    // 点击开始按钮然后完成
    const startButton = screen.getByText('开始');
    fireEvent.click(startButton);
    
    const finishButton = screen.getByText('完成');
    fireEvent.click(finishButton);
    
    // 点击记录结果按钮
    const resultsButton = screen.getByText('记录结果');
    fireEvent.click(resultsButton);
    
    // 在结果编辑器中输入结果
    await waitFor(() => {
      const resultsEditor = screen.getByLabelText('结果编辑器');
      userEvent.type(resultsEditor, 'Accuracy: 0.92\nPrecision: 0.89\nRecall: 0.94');
    });
    
    // 保存结果
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);
    
    // 验证结果已保存
    await waitFor(() => {
      expect(screen.getByText('结果已保存')).toBeInTheDocument();
    });
  });
});