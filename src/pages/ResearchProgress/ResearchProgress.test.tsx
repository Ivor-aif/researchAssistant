import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResearchProgress from './index';
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
  };
});

describe('ResearchProgress 组件', () => {
  beforeEach(() => {
    // 清除所有模拟函数的调用记录
    jest.clearAllMocks();
  });

  test('渲染研究进度页面', () => {
    render(<ResearchProgress />);
    
    // 验证页面标题存在
    expect(screen.getByText('研究进度跟踪')).toBeInTheDocument();
    
    // 验证添加里程碑按钮存在
    expect(screen.getByText('添加里程碑')).toBeInTheDocument();
  });

  test('打开添加里程碑模态框', async () => {
    render(<ResearchProgress />);
    
    // 点击添加里程碑按钮
    const addButton = screen.getByText('添加里程碑');
    fireEvent.click(addButton);
    
    // 验证模态框已打开
    await waitFor(() => {
      expect(screen.getByText('添加研究里程碑')).toBeInTheDocument();
      expect(screen.getByLabelText('标题')).toBeInTheDocument();
      expect(screen.getByLabelText('描述')).toBeInTheDocument();
      expect(screen.getByLabelText('日期')).toBeInTheDocument();
    });
  });

  test('添加新的里程碑', async () => {
    render(<ResearchProgress />);
    
    // 点击添加里程碑按钮
    const addButton = screen.getByText('添加里程碑');
    fireEvent.click(addButton);
    
    // 填写表单
    await waitFor(() => {
      const titleInput = screen.getByLabelText('标题');
      const descriptionInput = screen.getByLabelText('描述');
      
      userEvent.type(titleInput, '完成文献综述');
      userEvent.type(descriptionInput, '完成关于AI辅助研究的文献综述');
      
      // 注意：日期选择器的测试比较复杂，这里简化处理
      // 实际测试中可能需要模拟日期选择器的交互
    });
    
    // 点击确定按钮
    const okButton = screen.getByText('确定');
    fireEvent.click(okButton);
    
    // 验证新的里程碑已添加到列表中
    await waitFor(() => {
      expect(screen.getByText('完成文献综述')).toBeInTheDocument();
      expect(screen.getByText('完成关于AI辅助研究的文献综述')).toBeInTheDocument();
    });
  });

  test('更新里程碑状态', async () => {
    render(<ResearchProgress />);
    
    // 首先添加一个里程碑
    const addButton = screen.getByText('添加里程碑');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('标题');
      userEvent.type(titleInput, '实验设计');
      
      const okButton = screen.getByText('确定');
      fireEvent.click(okButton);
    });
    
    // 验证里程碑已添加并且状态为待处理
    await waitFor(() => {
      expect(screen.getByText('实验设计')).toBeInTheDocument();
      expect(screen.getByText('待处理')).toBeInTheDocument();
    });
    
    // 点击状态按钮更改状态
    const statusButton = screen.getByText('待处理');
    fireEvent.click(statusButton);
    
    // 验证状态已更改为进行中
    await waitFor(() => {
      expect(screen.getByText('进行中')).toBeInTheDocument();
    });
    
    // 再次点击状态按钮
    const newStatusButton = screen.getByText('进行中');
    fireEvent.click(newStatusButton);
    
    // 验证状态已更改为已完成
    await waitFor(() => {
      expect(screen.getByText('已完成')).toBeInTheDocument();
    });
  });

  test('删除里程碑', async () => {
    render(<ResearchProgress />);
    
    // 首先添加一个里程碑
    const addButton = screen.getByText('添加里程碑');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('标题');
      userEvent.type(titleInput, '数据收集');
      
      const okButton = screen.getByText('确定');
      fireEvent.click(okButton);
    });
    
    // 验证里程碑已添加
    await waitFor(() => {
      expect(screen.getByText('数据收集')).toBeInTheDocument();
    });
    
    // 点击删除按钮
    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);
    
    // 验证确认对话框出现
    await waitFor(() => {
      expect(screen.getByText('确定要删除这个里程碑吗？')).toBeInTheDocument();
    });
    
    // 点击确认删除
    const confirmButton = screen.getByText('是');
    fireEvent.click(confirmButton);
    
    // 验证里程碑已被删除
    await waitFor(() => {
      expect(screen.queryByText('数据收集')).not.toBeInTheDocument();
    });
  });
});