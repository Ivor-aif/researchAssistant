import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../Login';
import authReducer from '../__mocks__/authSlice';

// 导入测试库扩展
import '@testing-library/jest-dom';

// 创建测试用的 store
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// 测试组件包装器
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear();
  });

  test('渲染登录表单', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  test('输入验证', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /登录/i });

    // 测试空输入
    fireEvent.click(submitButton);
    expect(await screen.findByText(/请输入邮箱/i)).toBeInTheDocument();

    // 测试无效邮箱
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    expect(await screen.findByText(/请输入有效的邮箱地址/i)).toBeInTheDocument();

    // 测试有效输入
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/请输入邮箱/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/请输入有效的邮箱地址/i)).not.toBeInTheDocument();
    });
  });

  test('登录失败处理', async () => {
    // 模拟登录失败
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.reject(new Error('登录失败'))
    );

    renderWithProviders(<Login />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /登录/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/登录失败/i)).toBeInTheDocument();
    });
  });
});