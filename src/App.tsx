import React, { Component, ErrorInfo } from 'react'
import { ConfigProvider, theme, message } from 'antd'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { AuthProvider } from './contexts/AuthContext'
import { PaperSearchProvider } from './contexts/PaperSearchContext'
import './App.css'

// 错误边界组件
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新状态，下次渲染时显示错误UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('应用错误:', error);
    console.error('错误详情:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 显示自定义错误UI
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          marginTop: '50px' 
        }}>
          <h2>应用发生错误</h2>
          <p>请尝试刷新页面或联系管理员</p>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>错误详情</summary>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '5px',
              overflowX: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '20px', 
              padding: '8px 16px', 
              background: '#1890ff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
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

function App() {
  // 调试输出
  console.log('🚀 App.tsx - 应用组件开始渲染')

  // 在组件挂载后显示提示信息
  React.useEffect(() => {
    console.log('🚀 App.tsx - 应用组件已挂载')
    message.info('应用已加载完成', 2)
  }, [])

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1677ff',
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#ff4d4f',
            colorInfo: '#1677ff',
            borderRadius: 6,
          },
          components: {
            Layout: {
              bodyBg: '#f5f5f5',
              headerBg: '#fff',
              headerHeight: 64,
              headerPadding: '0 24px',
            },
            Card: {
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            },
            Button: {
              primaryShadow: 'none',
            },
          },
        }}
      >
        <div className="app-container">
          <AuthProvider>
            <PaperSearchProvider>
              <RouterProvider router={router} />
            </PaperSearchProvider>
          </AuthProvider>
        </div>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
