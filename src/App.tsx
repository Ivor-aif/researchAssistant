import { ConfigProvider, theme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { AuthProvider } from './contexts/AuthContext'
import { PaperSearchProvider } from './contexts/PaperSearchContext'
import './App.css'

function App() {
  // 调试输出
  console.log('🚀 App.tsx - 应用组件开始渲染')

  return (
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
  )
}

export default App
