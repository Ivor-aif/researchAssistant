import React, { useEffect } from 'react';
import { ConfigProvider, message, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PaperSearchProvider } from './contexts/PaperSearchContext';
import router from './router';
import './App.css';

// 自定义主题配置
const customTheme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    borderRadius: 6,
    wireframe: false,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      colorPrimary: '#1890ff',
      algorithm: true,
      borderRadius: 6,
    },
    Card: {
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    Menu: {
      itemBorderRadius: 6,
      itemMarginInline: 8,
      itemMarginBlock: 4,
    },
    Input: {
      borderRadius: 6,
    },
    Select: {
      borderRadius: 6,
    },
    Table: {
      borderRadius: 8,
      headerBg: '#fafafa',
    },
    Layout: {
      headerBg: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
      headerHeight: 64,
      siderBg: '#fff',
    },
  },
  algorithm: theme.defaultAlgorithm,
};

// 错误边界组件
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('应用错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '100px auto',
          textAlign: 'center',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <h1 style={{ color: '#f5222d', marginBottom: '24px', fontSize: '28px' }}>应用发生错误</h1>
          <p style={{ fontSize: '16px', color: 'rgba(0, 0, 0, 0.65)', marginBottom: '32px' }}>
            抱歉，应用程序遇到了一个问题。请尝试刷新页面或联系管理员。
          </p>
          
          <details style={{
            background: '#f9f9f9',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'left',
            marginBottom: '24px',
            border: '1px solid #eee'
          }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer', color: '#1890ff' }}>
              错误详情
            </summary>
            <pre style={{
              overflow: 'auto',
              padding: '16px',
              background: '#f5f5f5',
              borderRadius: '6px',
              marginTop: '12px',
              fontSize: '14px',
              color: '#d32029'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  useEffect(() => {
    message.success('AI 研究助手已加载完成');
  }, []);

  return (
    <ErrorBoundary>
      <ConfigProvider theme={customTheme}>
        <AuthProvider>
          <PaperSearchProvider>
            <RouterProvider router={router} />
          </PaperSearchProvider>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
